import { PublicPost, PostUserInfo } from "@/dto.ts";
import { jsonb_build_object } from "@/common/sql_util.ts";
import { select } from "@asla/yoursql";
import { v } from "@/sql/utils.ts";
import { TextStructure } from "@ijia/school-db/db";
import { getUserAvatarPath } from "@/common/oss_url.ts";

export type BaseSelect = {
  post_id: number;
  author: {
    user_name: string;
    user_id: string;
    avatar_url: string | null;
  } | null;
  publish_time: string | null;
  update_time: string;
  content_text: string | null;
  content_text_structure: TextStructure[] | null;
  ip_location: string | null;
  media: null;
  group: { group_id: string; group_name: string } | null;
  stat: {
    like_total: number;
    dislike_total: number;
    comment_total: number;
  };
  comment_tree_id: string | null;

  curr_user?: CurrUserSelect;
  config?: ConfigSelect;
  review?: ReviewSelect;
};
type CurrUserSelect = {
  can_update: boolean;
  disabled_comment_reason: string | null;
  like_weight: number | null;
};
type ConfigSelect = {
  is_anonymous: boolean;
  comment_disabled: boolean;
  self_visible: boolean;
};
type ReviewSelect = {
  status: number | null;
  remark: string | null;
};

const BASE_SELECT = {
  post_id: "p.id",
  /**
   * 不是匿名才存在作者信息
   */
  author: `CASE 
      WHEN (get_bit(p.options, 0)='0') 
      THEN (SELECT ${jsonb_build_object({
        user_name: "COALESCE(u.nickname, '')",
        user_id: "u.id ::TEXT",
        avatar_url: "u.avatar",
      } satisfies { [key in keyof PostUserInfo]: string })}
        FROM public.user AS u
        WHERE u.id = p.user_id)
      ELSE NULL END`,
  publish_time: "EXTRACT(EPOCH FROM p.publish_time)",
  update_time: "CASE WHEN p.update_time=p.create_time THEN NULL ELSE p.update_time END",

  content_text: "p.content_text",
  content_text_structure: "p.content_text_struct",
  ip_location: "null",
  media: "null",
  group: jsonb_build_object({ group_id: "g.id", group_name: "g.name" }),
  stat: jsonb_build_object({
    like_total: "p.like_count",
    dislike_total: "ROUND(p.dislike_count::NUMERIC /100, 2)",
    comment_total: "(SELECT comment_total FROM comment_tree WHERE id=p.comment_tree_id)",
  }),
  comment_tree_id: "p.comment_tree_id::TEXT",
} satisfies { [key in keyof BaseSelect]: string };

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

export function initRawList(rawList: BaseSelect[]): PublicPost[] {
  return rawList.map(({ curr_user, media, ...rest }): PublicPost => {
    return {
      ...rest,
      author: initAuthor(rest.author),
      curr_user: initRawCurrUser(curr_user),
      media: media ?? [],
      publish_time: rest.publish_time ? new Date(Math.floor(+rest.publish_time) * 1000).toISOString() : null,
    };
  });
}
function initRawCurrUser(currUser?: CurrUserSelect | null): PublicPost["curr_user"] | null {
  if (!currUser) return null;
  const { like_weight, can_update, disabled_comment_reason } = currUser;
  return {
    is_like: like_weight ? like_weight > 0 : false,
    is_report: like_weight ? like_weight < 0 : false,
    can_update: can_update,
    can_comment: disabled_comment_reason === null,
    disabled_comment_reason: disabled_comment_reason ?? undefined,
  };
}
function initAuthor(author: BaseSelect["author"]): PublicPost["author"] | null {
  if (!author) return null;
  return {
    ...author,
    avatar_url: getUserAvatarPath(author.avatar_url),
  };
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
