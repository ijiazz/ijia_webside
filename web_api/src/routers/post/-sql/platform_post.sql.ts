import { dbPool } from "@/db/client.ts";
import {
  pla_asset,
  pla_user,
  Platform,
  DbPlaAssetMedia,
  MediaLevel,
  TextStructure,
  watching_pla_user,
  USER_LEVEL,
  MediaType,
} from "@ijia/data/db";
import { createSearch, jsonb_build_object } from "@/global/sql_util.ts";
import { GetListOption } from "@/dto/common.ts";
import { PostAssetType, PostUserInfo, PlatformPostItemDto } from "@/dto/post.ts";
import { AssetMediaDto, MulFormat, AssetImage } from "@/dto/media.ts";
import { assetMediaToDto } from "../-utils/media.ts";
import { getPostContentType } from "./sql_tool.ts";
import { select } from "@asla/yoursql";
import { v } from "@/sql/utils.ts";
import { QueryRowsResult } from "@asla/pg";
import { getBucket } from "@ijia/data/oss";
const BUCKETS = getBucket();
export type GetAssetListOption = GetListOption & {
  platform?: Platform;
  userId?: string;
  s_content?: string;
  s_author?: string;
  includeHidden?: boolean;
  sort?: Record<"digg_total" | "forward_total" | "collection_num", "ASC" | "DESC">;
};

function selectAssetResource(setKey: string) {
  return select(
    `json_agg(${jsonb_build_object({
      media_type: `SELECT type FROM sys.file WHERE bucket=${v(BUCKETS.PLA_POST_MEDIA)} AND filename=media.filename`,
      index: "media.index",
      level: "media.level",
      filename: "media.filename",
    })})`,
  )
    .from("pla.asset_media", { as: "media" })
    .where(`media.platform=${setKey}.platform AND media.asset_id=${setKey}.asset_id AND index IS NOT NULL`);
}
type RawMedia = Pick<DbPlaAssetMedia, "filename" | "index" | "level"> & { media_type: MediaType };
type SelectAssetList = {
  post_id: string;
  platform: Platform;
  publish_time: Date | null;
  type: PostAssetType;
  ip_location: string | null;
  content_text: string | null;
  content_text_structure: TextStructure[] | null;
  author: PostUserInfo & { extra: Record<string, any> };
  media: RawMedia[] | null;
};
async function selectAssetList(option: GetAssetListOption = {}): Promise<{ total: number; items: SelectAssetList[] }> {
  const { number = 20, offset = 0, platform, userId, sort, includeHidden } = option;
  const createJoin = (statement: ReturnType<typeof select>) => {
    return statement
      .from(watching_pla_user.name, { as: "god_user" })
      .innerJoin(pla_user.name, {
        as: "u",
        on: ["u.platform=god_user.platform ", " u.pla_uid=god_user.pla_uid", `god_user.level >=${USER_LEVEL.god}`],
      })
      .innerJoin(pla_asset.name, {
        as: "p",
        on: () => {
          const where = ["p.platform=u.platform", "p.pla_uid=u.pla_uid"];
          if (!includeHidden) {
            const condition =
              "( god_user.visible_time_second IS NULL OR NOW() - p.publish_time < INTERVAL '1 second' * visible_time_second )";
            where.push(condition);
          }
          return where;
        },
      });
  };

  const itemsSql = createJoin(
    select<SelectAssetList>({
      post_id: "p.asset_id",
      platform: "p.platform",
      publish_time: "p.publish_time",
      type: getPostContentType("p.content_type"),
      ip_location: "p.ip_location",
      content_text: "p.content_text",
      content_text_structure: "p.content_text_struct",
      //   stat: jsonb_build_object({ collection_num: true, forward_total: "forward_num", digg_total: "like_count" }, "p"),
      author: jsonb_build_object({
        user_name: "u.user_name",
        user_id: "u.pla_uid",
        avatar_url: "'/file/avatar/'||u.avatar",
        extra: "u.extra",
      }),
      media: selectAssetResource("p").toSelect(),
    }),
  )
    .where(() => {
      const searchWhere: string[] = [];
      if (option.s_author) searchWhere.push(createSearch("u.user_name", option.s_author));
      if (option.s_content) searchWhere.push(createSearch("p.content_text", option.s_content));
      if (platform) {
        searchWhere.push(`p.platform = ${v(platform)}`);
        if (userId) searchWhere.push(`p.pla_uid = ${v(userId)}`);
      } else if (userId) throw new Error("存在 userId 时必须传入 platform");

      return searchWhere;
    })
    .orderBy(() => {
      let by: string[] = ["p.publish_time DESC"];
      if (sort) {
        const map: Record<string, string> = {
          digg_total: "p.like_count",
          forward_total: "p.forward_num",
          collection_num: "p.collection_num",
        };
        for (const [k, v] of Object.entries(sort)) {
          if (!map[k]) continue;
          by.push(map[k] + " " + v);
        }
      }
      return by;
    })
    .limit(number, offset);

  const totalSql = createJoin(select("count(*)::INT"));
  const [counts, items] = await dbPool
    .query<[QueryRowsResult, QueryRowsResult]>([totalSql, itemsSql])
    .then(([r1, r2]) => [r1.rows, r2.rows]);
  return {
    total: counts[0].count,
    items,
  };
}
function toPostListDto(list: SelectAssetList[]) {
  return list.map((item): PlatformPostItemDto => {
    const groups = groupByIndex(item.media ?? []);

    const setCover = groups[0];
    const covers = setCover ? toFormats(setCover.data, assetMediaToDto) : undefined;

    const medias = moveArr(groups).map((indexGroup): AssetMediaDto | undefined => {
      if (!indexGroup) return undefined;
      const group = indexGroup.data;
      const formats = toFormats(group, assetMediaToDto);
      let cover: AssetImage | undefined;
      if (indexGroup.type === MediaType.image) {
        cover = getCover(formats as MulFormat<AssetImage>);
      } else if (covers) {
        cover = getCover(covers as MulFormat<AssetImage>);
      }
      return {
        type: indexGroup.type,
        formats: formats as any,
        origin: formats[MediaLevel.origin]! as any,
        cover: cover,
        covers: covers as any,
      };
    });

    const authRaw = item.author;
    const author: PlatformPostItemDto["author"] = {
      user_name: authRaw.user_name,
      user_id: authRaw.user_id,
      avatar_url: authRaw.avatar_url,
      home_page: undefined,
    };
    let url: string | undefined;

    //TODO:补充其他平台
    switch (item.platform) {
      case Platform.douYin: {
        url = `https://www.douyin.com/video/${item.post_id}`;
        author.home_page = `https://www.douyin.com/user/${item.author.extra?.sec_uid}`;
        break;
      }
      case Platform.bilibili:
        break;
      case Platform.xiaoHongShu:
        break;
      case Platform.weibo: {
        url = `https://weibo.com/${author.user_id}/${item.post_id}`;
        author.home_page = `https://weibo.com/u/${author.user_id}`;

        break;
      }
      case Platform.v5sing:
        break;
      case Platform.wangYiMusic:
        break;
      default:
        break;
    }

    return {
      post_id: item.post_id,
      media: medias,
      author,
      content_text: item.content_text,
      content_text_structure: item.content_text_structure,
      publish_time: item.publish_time?.toISOString(),
      ip_location: item.ip_location,
      platform: item.platform,
      type: item.type,
      url,
    };
  });
}

function moveArr<T>(arr: T[]) {
  if (arr.length) {
    // 向左移动一位，因为 index 0 是封面
    arr[0] = arr[1];
    const max = -arr.length - 1;
    for (let i = 0; i < max; i++) {
      arr[i] = arr[i + 1];
    }
    arr.length -= 1;
  }
  return arr;
}
export async function getGodPost(option?: GetAssetListOption) {
  const raw = await selectAssetList(option);
  const items = toPostListDto(raw.items);
  return {
    total: raw.total,
    items,
  };
}

export type AssetStat = {
  comment_total: number;
  digg_total: number;
  forward_total: number;
  collection_num: number;
};

function groupByIndex<T extends { index: number; level?: string | null; media_type: MediaType }>(
  list: T[],
): ({ type: MediaType; data: T[] } | undefined)[] {
  const groups: ({ type: MediaType; data: T[] } | undefined)[] = [];
  for (const item of list) {
    const index = item.index;
    if (index === null) continue;
    if (!groups[index]) groups[index] = { type: item.media_type, data: [] };
    groups[index].data.push(item);
  }
  return groups;
}

function toFormats<C, T extends { level?: string | null }>(
  list: T[],
  mapFn: (item: T) => C,
): Record<MediaLevel, C | undefined> {
  const map: Record<string, C> = {};
  for (const item of list) {
    const level = item.level as MediaLevel;
    if (map[level]) continue;
    map[level] = mapFn(item);
  }
  return map;
}
function getCover(format: MulFormat<AssetImage>): AssetImage | undefined {
  const formats = [MediaLevel.thumb, MediaLevel.origin];
  for (const item of formats) {
    if (format[item]) return format[item];
  }
}
