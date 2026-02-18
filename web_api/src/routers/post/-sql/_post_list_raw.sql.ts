import { PublicPost, PostUserInfo } from "@/dto.ts";
import { jsonb_build_object } from "@/global/sql_util.ts";
import { select } from "@asla/yoursql";
import { v } from "@/sql/utils.ts";

export type BaseSelect = {
  post_id: number;
  author: {
    user_name: string | null;
    user_id: number;
    avatar_url: string | null;
  } | null;
  publish_time: string | null;
  create_time: string;
  update_time: string;
  context_text: string | null;
  content_text_structure?: string[];
  ip_location: string | null;
  media: null;
  group: number | null;
  stat: {
    like_total: number;
    dislike_total: number;
    comment_total: number;
  };
};

const BASE_SELECT = {
  post_id: "p.id",
  /**
   * 不是匿名才存在作者信息
   */
  author: `CASE 
      WHEN (get_bit(p.options, 0)='0') 
      THEN (SELECT ${jsonb_build_object({
        user_name: "u.nickname",
        user_id: "u.id ::TEXT",
        avatar_url: "'/file/avatar/'||u.avatar",
      } satisfies { [key in keyof PostUserInfo]: string })}
        FROM public.user AS u
        WHERE u.id = p.user_id)
      ELSE NULL END`,
  publish_time: "EXTRACT(EPOCH FROM p.publish_time)",
  update_time: "CASE WHEN p.update_time=p.create_time THEN NULL ELSE p.update_time END",

  content_text: "p.content_text",
  content_text_structure: "p.content_text_struct",
  ip_location: "null", //TODO
  media: "null", //TODO
  group: jsonb_build_object({ group_id: "g.id", group_name: "g.name" }),
  stat: jsonb_build_object({
    like_total: "p.like_count",
    dislike_total: "ROUND(p.dislike_count::NUMERIC /100, 2)",
    comment_total: "comment_num",
  }),
} satisfies { [key in keyof PublicPost]: string };

function ifIsAuthor(sql: string, currentUserId: number | null) {
  if (currentUserId === null) return "null";
  return `CASE WHEN p.user_id = ${v(currentUserId)} THEN (${sql}) ELSE NULL END`;
}

function withCurrentUser(currentUserId: number | null) {
  if (currentUserId === null) return undefined;
  return {
    curr_user: jsonb_build_object({
      can_update: `p.user_id=${v(currentUserId)}`,
      disabled_comment_reason: `
      CASE 
        WHEN review_status_is_progress(p.review_status) THEN '审核中或审核不通过的帖子不能评论' 
        WHEN get_bit(p.options, 1)='1' AND p.user_id != ${v(currentUserId)} THEN '作者评论已关闭功能' 
        ELSE NULL END`,

      /** like_weight 用量计算 is_like 和 is_report */
      like_weight: `${select("weight")
        .from("post_like")
        .where(["post_id=p.id", `user_id=${v(currentUserId)}`])
        .toSelect()}`,
    }),
    config: ifIsAuthor(
      jsonb_build_object({
        is_anonymous: "get_bit(p.options, 0)::BOOL",
        comment_disabled: "get_bit(p.options, 1)::BOOL",
        self_visible: "p.is_hide",
      }),
      currentUserId,
    ),
    review: ifIsAuthor(
      jsonb_build_object({
        status: "p.review_status",
        remark: "(SELECT r.comment FROM review AS r WHERE r.id=p.review_id)",
      }),
      currentUserId,
    ),
  };
}
export function createSelect(currentUserId: number | null) {
  return select({
    ...BASE_SELECT,
    ...withCurrentUser(currentUserId),
  })
    .from("public.post", { as: "p" })
    .leftJoin("post_group", { as: "g", on: "g.id=p.group_id" });
}
export function getCursor(rawList: any[]) {
  const list = rawList;
  const first = list[0];
  const last = list[list.length - 1];
  const cursor_prev = first ? toTimestampCursor(first.publish_time, first.post_id) : null;
  const cursor_next = last ? toTimestampCursor(last.publish_time, last.post_id) : null;
  return { cursor_prev, cursor_next };
}
export function initRawList(rawList: any[]) {
  const list = rawList;

  rawList.forEach((item) => {
    const currUser = item.curr_user;
    if (currUser) {
      const weight = currUser.like_weight;
      delete currUser.like_weight; // 删除不需要的字段
      const postItem = currUser as NonNullable<PublicPost["curr_user"]>;
      if (weight) {
        postItem.is_like = weight > 0; // 是否点赞
        postItem.is_report = weight < 0; // 是否举报
      }

      const curr_user: NonNullable<PublicPost["curr_user"]> = currUser;
      curr_user.can_comment = curr_user.disabled_comment_reason === null;
    }

    if (item.publish_time) {
      item.publish_time = new Date(Math.floor(+item.publish_time) * 1000).toISOString();
    }
  });
  return list;
}
export function getCursorCondition(cursorStr: string, forward?: boolean): string {
  const cursor = parserTimestampCursor(cursorStr);
  const ts = cursor.timestamp;
  if (!ts) {
    if (forward) return `(p.publish_time IS NULL AND p.id > ${v(cursor.id)})`;
    else return `(p.publish_time IS NULL AND p.id < ${v(cursor.id)})`;
  } else {
    if (forward) {
      return `(p.publish_time > to_timestamp(${v(ts)}) OR (p.publish_time = to_timestamp(${v(ts)}) AND p.id > ${v(cursor.id)}))`;
    } else {
      return `(p.publish_time < to_timestamp(${v(ts)}) OR (p.publish_time = to_timestamp(${v(ts)}) AND p.id < ${v(cursor.id)}))`;
    }
  }
}

function parserTimestampCursor(cursorStr: string): PublishedPostCursor {
  const [timestampStr, idStr] = cursorStr.split("/");
  if (!timestampStr || !idStr) throw new Error("cursor 格式错误");
  const timestamp = timestampStr === "0" ? null : timestampStr;

  const id = +idStr;
  if (!Number.isInteger(id)) throw new Error("cursor 格式错误");
  return { timestamp: timestamp, id: id };
}
function toTimestampCursor(timestamp: string | null, id: number): string {
  return `${timestamp ?? "0"}/${id}`;
}
type PublishedPostCursor = {
  /** publish_timestamp */
  timestamp?: string | null;
  id: number;
};
