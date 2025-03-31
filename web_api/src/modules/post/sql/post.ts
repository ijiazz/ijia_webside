import { ConditionParam, Selection, v, YourTable, dbPool } from "@ijia/data/yoursql";
import {
  pla_asset,
  pla_comment,
  pla_user,
  Platform,
  asset_audio,
  asset_image,
  asset_video,
  DbAssetAudio,
  DbAssetImage,
  DbAssetVideo,
  MediaLevel,
  TextStructure,
  watching_pla_user,
  USER_LEVEL,
} from "@ijia/data/db";
import { createSearch, jsonb_build_object } from "@/global/sql_util.ts";
import { GetListOption } from "@/modules/dto_common.ts";
import { AssetItemDto, PostUserInfo } from "../post.dto.ts";
import { AudioAssetDto, ImageAssetDto, ImageInfoDto, MulFormat, VideoAssetDto } from "../common.dto.ts";
import { audioToDto, getPostAssetsType, imageToDto, videoToDto } from "./media.ts";

export type GetAssetListOption = GetListOption & {
  platform?: Platform;
  userId?: string;
  s_content?: string;
  s_author?: string;

  sort?: Record<"digg_total" | "forward_total" | "collection_num", "ASC" | "DESC">;
};

function selectAssetResource(
  setKey: string,
  table: YourTable<{ platform: Platform | null; asset_id: string | null }>,
  keys?: Record<string, string | boolean>,
) {
  return Selection.from(table, "media")
    .select(`json_agg(${keys ? jsonb_build_object(keys, "media") : "media"})`)
    .where(`media.platform=${setKey}.platform AND media.asset_id=${setKey}.asset_id AND index IS NOT NULL`);
}
type SelectAssetList = {
  asset_id: string;
  platform: Platform;
  publish_time: Date | null;
  type: string;
  ip_location: string | null;
  content_text: string | null;
  content_text_structure: TextStructure[] | null;
  author: PostUserInfo & { extra: Record<string, any> };
  audio: DbAssetAudio[] | null;
  video: DbAssetVideo[] | null;
  image: DbAssetImage[] | null;
};
async function selectAssetList(option: GetAssetListOption = {}): Promise<{ total: number; items: SelectAssetList[] }> {
  const { number = 20, offset = 0, platform, userId, sort } = option;

  const select = watching_pla_user
    .fromAs("god_user")
    .innerJoin(pla_user, "u", [
      "u.platform=god_user.platform ",
      " u.pla_uid=god_user.pla_uid",
      `god_user.level >=${USER_LEVEL.god}`,
    ])
    .innerJoin(pla_asset, "p", ["p.platform=u.platform", "p.pla_uid=u.pla_uid"]);

  const itemsSql = select
    .select<SelectAssetList>({
      asset_id: "p.asset_id",
      platform: "p.platform",
      publish_time: "p.publish_time",
      type: "p.content_type",
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
      audio: selectAssetResource("p", asset_audio).toSelect(),
      video: selectAssetResource("p", asset_video).toSelect(),
      image: selectAssetResource("p", asset_image).toSelect(),
    })
    .where((): ConditionParam => {
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

  const totalSql = select.select("count(*)::INT");
  const [counts, items] = await dbPool.multipleQueryRows(totalSql.toString() + ";\n" + itemsSql.toString());
  return {
    total: counts[0].count,
    items,
  };
}
function toPostListDto(list: SelectAssetList[]) {
  return list.map((item): AssetItemDto => {
    const type = getPostAssetsType(item.type);

    const videoFormats = moveArr(groupByIndex(item.video ?? []), 1).map((items) =>
      items ? toFormats(items, videoToDto) : {},
    );
    const [cover, ...imageFormats] = groupByIndex(item.image ?? []).map((items) =>
      items ? toFormats(items, imageToDto) : {},
    );
    const audioFormats = moveArr(groupByIndex(item.audio ?? []), 1).map((items) =>
      items ? toFormats(items, audioToDto) : {},
    );

    const imageList = imageFormats.map((item): ImageAssetDto | undefined => {
      const { [MediaLevel.origin]: origin, ...formats } = item;
      if (!origin) return undefined;
      return { formats, origin };
    });

    const videoList = videoFormats.map((item, index): VideoAssetDto | undefined => {
      const { [MediaLevel.origin]: origin, ...formats } = item;
      if (!origin) return undefined;
      const covers = index === 0 ? cover : undefined;
      return {
        covers,
        cover: covers ? getCover(covers) : undefined,
        origin,
        formats,
      };
    });
    const audioList = audioFormats.map((item, index): AudioAssetDto | undefined => {
      const { [MediaLevel.origin]: origin, ...formats } = item;
      if (!origin) return undefined;
      const covers = index === 0 ? cover : undefined;
      return {
        covers,
        cover: covers ? getCover(covers) : undefined,
        formats,
        origin,
      };
    });
    const authRaw = item.author;
    const author: AssetItemDto["author"] = {
      user_name: authRaw.user_name,
      user_id: authRaw.user_id,
      avatar_url: authRaw.avatar_url,
      home_page: undefined,
    };
    let url: string | undefined;

    //TODO:补充其他平台
    switch (item.platform) {
      case Platform.douYin: {
        url = `https://www.douyin.com/video/${item.asset_id}`;
        author.home_page = `https://www.douyin.com/user/${item.author.extra?.sec_uid}`;
        break;
      }
      case Platform.bilibili:
        break;
      case Platform.xiaoHongShu:
        break;
      case Platform.weibo: {
        url = `https://weibo.com/${author.user_id}/${item.asset_id}`;
        author.home_page = `https://weibo.com/u/${author.user_id}`;

        const expireTime = (86400 * 365 * 1000) / 2; //TODO: 改为可配置

        if (!item.publish_time || Date.now() - item.publish_time.getTime() > expireTime) {
          item.content_text = "微博不可见";
          item.content_text_structure = null;
          imageList.length = 0;
          videoList.length = 0;
          audioList.length = 0;
        }
        // 是否可见
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
      asset_id: item.asset_id,

      author,
      content_text: item.content_text,
      content_text_structure: item.content_text_structure,
      publish_time: item.publish_time?.toISOString(),
      ip_location: item.ip_location,
      platform: item.platform,
      type,
      videoList,
      audioList,
      imageList,
      url,
    };
  });
}
function getCover(format: MulFormat<ImageInfoDto>) {
  const formats = [MediaLevel.thumb, MediaLevel.origin];
  for (const item of formats) {
    if (format[item]) return format[item];
  }
}
function moveArr<T>(arr: T[], offset: number) {
  if (arr.length) {
    // 向左移动一位，因为 index 0 是封面
    arr[0] = arr[1];
    const max = -arr.length - 1;
    for (let i = 0; i < max; i++) {
      arr[i] = arr[i + 1];
    }
    arr.length -= offset;
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
function selectAssetStat(selectableSymbol: string) {
  return Selection.from(selectableSymbol, "t")
    .innerJoin(pla_comment, "c", "c.asset_id=t.asset_id")
    .select({ asset_id: "c.asset_id", count: "count(*)::INT" })
    .groupBy("c.asset_id");
}

export type AssetStat = {
  comment_total: number;
  digg_total: number;
  forward_total: number;
  collection_num: number;
};

function groupByIndex<T extends { index: number | null; level: string | null }>(list: T[]): (T[] | undefined)[] {
  const group: (T[] | undefined)[] = [];
  for (const item of list) {
    const index = item.index;
    if (index === null) continue;
    if (!group[index]) group[index] = [];
    group[index].push(item);
  }

  return group;
}

function toFormats<C, T extends { level: string | null }>(
  list: T[],
  mapFn: (item: T) => C,
): Record<string, C | undefined> {
  const map: Record<string, C> = {};
  for (const item of list) {
    const level = item.level as MediaLevel;
    if (map[level]) continue;
    map[level] = mapFn(item);
  }
  return map;
}
