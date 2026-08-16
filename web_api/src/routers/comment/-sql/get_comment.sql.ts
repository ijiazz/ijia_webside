import { dbPool } from "@/db/client.ts";
import { CommentDTO, GetCommentListOption, GetCommentListOutput } from "@ijia/api-types";
import { HttpError } from "@/common/errors.ts";
import { jsonb_build_object } from "@/common/sql_util.ts";
import { v } from "@/sql/utils.ts";
import { select } from "@asla/yoursql";

export async function getCommentList(
  filters: GetCommentListOption & { commentTreeId?: number; commentId?: number; parentCommentId?: number },
  userId: number | null,
): Promise<GetCommentListOutput> {
  const { number = 20, cursor: cursorStr, forward, commentId, parentCommentId, commentTreeId } = filters;
  if (!commentTreeId && !parentCommentId && !commentId) {
    throw new HttpError(400, "必须指定其中一个参数：commentTreeId、parentCommentId、commentId");
  }

  let currentUserId = userId;
  if (typeof currentUserId !== "number") currentUserId = null;
  const cursor = cursorStr ? parserTimestampCursor(cursorStr) : null;

  let currUserSql: string | undefined;
  if (currentUserId !== null) {
    currUserSql = jsonb_build_object({
      can_update: `u.id=${v(currentUserId)} OR ct.owner_id=${v(currentUserId)}`,

      /** like_weight 用量计算 is_like 和 is_report */
      like_weight: `${select("weight")
        .from("comment_like")
        .where(["comment_id=c.id", `user_id=${v(currentUserId)}`])
        .toSelect()}`,
    });
  } else {
    currUserSql = "null";
  }

  const sql = select<Record<string, any>>([
    "c.comment_tree_id::TEXT AS comment_tree_id",
    "c.id::TEXT AS comment_id",
    "c.root_comment_id::TEXT AS root_comment_id",
    "c.is_root_reply_count",
    "c.reply_count",
    "EXTRACT(epoch FROM c.create_time) AS create_time",
    "c.content_text",
    "c.content_text_struct AS content_text_structure",
    "c.like_count",
    `${jsonb_build_object({
      user_id: "u.id ::TEXT",
      user_name: "u.nickname",
      avatar_url: "'/file/avatar/'||u.avatar",
    })} AS user`,
    `${currUserSql} as curr_user`,
    `(CASE WHEN c.parent_comment_id IS NULL THEN NULL 
        ELSE
      ${jsonb_build_object({
        user: select(`${jsonb_build_object({ user_id: "id", user_name: "nickname" })} `)
          .from("public.user")
          .where("reply.user_id=id")
          .toSelect(),
        comment_id: "c.parent_comment_id::TEXT",
        is_deleted: "reply.is_delete",
      })}
        END) AS reply_to`,
  ])
    .from("comment", { as: "c" })
    .innerJoin("public.user", { as: "u", on: "c.user_id=u.id" })
    .innerJoin("comment_tree", { as: "ct", on: "c.comment_tree_id=ct.id" })
    .leftJoin("post", { as: "p", on: "ct.id=p.comment_tree_id" })
    .leftJoin("comment", { as: "reply", on: "c.parent_comment_id=reply.id" })
    .where(() => {
      const where = [`NOT c.is_delete`];

      where.push(
        `(ct.owner_id = ${v(currentUserId)} OR (p.id IS NOT NULL AND NOT p.is_delete AND ${[
          "NOT review_status_is_progress(p.review_status)",
          "NOT p.is_hide",
        ].join(" AND ")}))`,
      );

      if (commentId) {
        where.push(`c.id=${v(commentId)}`);
      } else {
        if (commentTreeId) {
          where.push(`c.comment_tree_id=${v(commentTreeId)}`, `c.root_comment_id IS NULL`);
        } else if (parentCommentId) {
          where.push(`c.root_comment_id =${v(parentCommentId)}`);
        } else {
          throw new HttpError(400, "必须指定 commentTreeId、parentCommentId 或 commentId 之一");
        }

        if (cursor) {
          const timestamp = cursor.timestamp;
          if (forward) {
            where.push(
              `(c.create_time < to_timestamp(${timestamp}) OR (c.create_time = to_timestamp(${timestamp}) AND c.id < ${v(cursor.id)}))`,
            );
          } else {
            where.push(
              `(c.create_time > to_timestamp(${timestamp}) OR (c.create_time = to_timestamp(${timestamp}) AND c.id > ${v(cursor.id)}))`,
            );
          }
        }
      }
      return where;
    })
    .orderBy(["c.create_time ASC", "c.id ASC"])
    .limit(number);

  const raw = await dbPool.queryRows(sql);

  raw.forEach((item) => {
    const currUser = item.curr_user;
    if (currUser) {
      const weight = currUser.like_weight;
      delete currUser.like_weight; // 删除不需要的字段
      const postItem = currUser as NonNullable<CommentDTO["curr_user"]>;
      if (weight) {
        postItem.is_like = weight > 0; // 是否点赞
        postItem.is_report = weight < 0; // 是否举报
      }
    }
  });
  const list = raw as CommentDTO[];
  const first = list[0];
  const lastItem = list[list.length - 1];
  return {
    cursor_prev: first ? toTimestampCursor({ timestamp: first.create_time, id: +first.comment_id }) : undefined,
    cursor_next: lastItem
      ? toTimestampCursor({ timestamp: lastItem.create_time, id: +lastItem.comment_id })
      : undefined,
    items: list,
  };
}

function parserTimestampCursor(cursorStr: string): TzIdCursor {
  const [timestampStr, idStr] = cursorStr.split("-");
  if (!timestampStr || !idStr) throw new Error("cursor 格式错误");
  const timestamp = +timestampStr;
  if (!Number.isFinite(timestamp)) throw new Error("cursor 格式错误");

  const id = +idStr;
  if (!Number.isInteger(id)) throw new Error("cursor 格式错误");

  return { timestamp: timestamp, id: id };
}
function toTimestampCursor(cursor: TzIdCursor): string {
  return `${cursor.timestamp}-${cursor.id}`;
}
export type TzIdCursor = {
  /** timestamp */
  timestamp: number | null;
  id: number;
};
