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
import { PostUserInfo } from "../post.dto.ts";
import { AudioInfoDto, ImageInfoDto, VideoInfoDto } from "../common.dto.ts";
import { getBucket } from "@ijia/data/oss";

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
  publish_time: Date;
  type: string;
  ip_location: string | null;
  content_text: string | null;
  content_text_structure: TextStructure[] | null;
  author: PostUserInfo & { extra: Record<string, any> };
  audio: DbAssetAudio[] | null;
  video: DbAssetVideo[] | null;
  image: DbAssetImage[] | null;
};
export async function selectAssetList(
  option: GetAssetListOption = {},
): Promise<{ total: number; items: SelectAssetList[] }> {
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
export function audioToDto(item: DbAssetAudio): AudioInfoDto {
  return {
    url: "/file/" + getBucket().ASSET_AUDIO + "/" + item.uri,
    duration: item.duration,
    size: item.size,
  };
}
export function videoToDto(item: DbAssetVideo): VideoInfoDto {
  return {
    url: "/file/" + getBucket().ASSET_VIDEO + "/" + item.uri,
    format: item.format,
    height: item.height,
    width: item.width,
    size: item.size,
  };
}
export function imageToDto(item: DbAssetImage): ImageInfoDto {
  return {
    url: "/file/" + getBucket().ASSET_IMAGES + "/" + item.uri,
    height: item.height,
    width: item.width,
  };
}

export function groupByIndex<T extends { index: number | null; level: string | null }>(list: T[]): (T[] | undefined)[] {
  const group: (T[] | undefined)[] = [];
  for (const item of list) {
    const index = item.index;
    if (index === null) continue;
    if (!group[index]) group[index] = [];
    group[index].push(item);
  }

  return group;
}

export function toFormats<C, T extends { level: string | null }>(
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
