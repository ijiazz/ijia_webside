import { Selection, v, YourTable } from "@ijia/data/yoursql";
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
} from "@ijia/data/db";
import { createSearch, jsonb_build_object } from "@/global/sql_util.ts";
import { GetListOption } from "@/modules/dto_common.ts";
import { UserSampleInfo } from "../common.dto.ts";

export type GetAssetListOption = GetListOption & {
  platform?: Platform;
  userId?: string;
  s_content?: string;
  s_author?: string;

  sort?: Record<"publish_time" | "digg_total" | "forward_total" | "collection_num", "ASC" | "DESC">;
};

function selectAssetResource(
  setKey: string,
  table: YourTable<{ platform: Platform | null; asset_id: string | null }>,
  keys?: Record<string, string | boolean>,
) {
  return Selection.from(table, "media")
    .select(`json_agg(${keys ? jsonb_build_object(keys, "media") : "media"})`)
    .where(`media.platform=${setKey}.platform AND media.asset_id=${setKey}.asset_id`);
}

export function selectAssetList(option: GetAssetListOption = {}) {
  const { number = 20, offset = 0, platform, userId, sort } = option;
  const selectable = pla_asset
    .fromAs("p")
    .innerJoin(pla_user, "u", "u.pla_uid=p.pla_uid")
    .select<{
      asset_id: string;
      platform: Platform;
      publish_time: Date;
      type: string;
      ip_location: string | null;
      content_text: string | null;
      author: UserSampleInfo;
      audio: DbAssetAudio[] | null;
      video: DbAssetVideo[] | null;
      image: DbAssetImage[] | null;
    }>({
      asset_id: "p.asset_id",
      platform: "p.platform",
      publish_time: "p.publish_time",
      type: "p.content_type",
      ip_location: "p.ip_location",
      content_text: "p.content_text",
      //   stat: jsonb_build_object({ collection_num: true, forward_total: "forward_num", digg_total: "like_count" }, "p"),
      author: jsonb_build_object({ user_name: true, user_id: "pla_uid" }, "u"),
      audio: selectAssetResource("p", asset_audio).toSelect(),
      video: selectAssetResource("p", asset_video).toSelect(),
      image: selectAssetResource("p", asset_image).toSelect(),
    })
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
      let by: string[] = [];
      if (sort) {
        const map: Record<string, string> = {
          publish_time: "p.published_time",
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
  return selectable.queryRows();
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
