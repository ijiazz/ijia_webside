import { post, post_comment, user, post_comment_like } from "@ijia/data/db";
import { dbPool } from "@/db/client.ts";
import { GetPostCommentListOption, PostCommentDto, PostCommentResponse } from "@/dto/post_comment.ts";
import { HttpError } from "@/global/errors.ts";
import { jsonb_build_object } from "@/global/sql_util.ts";
import { parserTimestampCursor, toTimestampCursor } from "../../-utils/_util.ts";
import { v } from "@/sql/utils.ts";
import { select } from "@asla/yoursql";

export async function getCommentList(
  filters: GetPostCommentListOption & { postId?: number; commentId?: number; parentCommentId?: number },
  userId: number | null,
): Promise<PostCommentResponse> {
  const { number = 20, cursor: cursorStr, forward, commentId, parentCommentId, postId } = filters;
  if (!postId && !parentCommentId && !commentId) {
    throw new HttpError(400, "必须指定其中一个参数：postId、parentCommentId、commentId");
  }

  let currentUserId = userId;
  if (typeof currentUserId !== "number") currentUserId = null;
  const cursor = cursorStr ? parserTimestampCursor(cursorStr) : null;

  let currUserSql: string | undefined;
  if (currentUserId !== null) {
    currUserSql = jsonb_build_object({
      can_update: `u.id=${v(currentUserId)} OR p.user_id=${v(currentUserId)}`,

      /** like_weight 用量计算 is_like 和 is_report */
      like_weight: `${select("weight")
        .from(post_comment_like.name)
        .where(["comment_id=c.id", `user_id=${v(currentUserId)}`])
        .toSelect()}`,
    });
  } else {
    currUserSql = "null";
  }

  const sql = select<Record<string, any>>([
    "c.post_id",
    "c.id as comment_id",
    "c.root_comment_id",
    "c.is_root_reply_count",
    "c.reply_count",
    "EXTRACT(epoch FROM c.create_time) AS create_time",
    "c.content_text",
    "c.content_text_struct",
    "c.like_count",
    `${jsonb_build_object({
      user_id: "u.id",
      user_name: "u.nickname",
      avatar_url: "'/file/avatar/'||u.avatar",
    })} AS user`,
    `${currUserSql} as curr_user`,
    `(CASE WHEN c.parent_comment_id IS NULL THEN NULL 
        ELSE
      ${jsonb_build_object({
        user: select(`${jsonb_build_object({ user_id: "id", user_name: "nickname" })} `)
          .from(user.name)
          .where("reply.user_id=id")
          .toSelect(),
        comment_id: "c.parent_comment_id",
        is_deleted: "reply.is_delete",
      })}
        END) AS reply_to`,
  ])
    .from(post_comment.name, { as: "c" })
    .innerJoin(user.name, { as: "u", on: "c.user_id=u.id" })
    .innerJoin(post.name, { as: "p", on: ["c.post_id=p.id", "NOT p.is_delete"] })
    .leftJoin(post_comment.name, { as: "reply", on: "c.parent_comment_id=reply.id" })
    .where(() => {
      const where = [`NOT c.is_delete`];

      where.push(
        `(p.user_id = ${v(currentUserId)} OR (${[
          "NOT p.is_reviewing",
          "NOT p.is_hide",
          "(p.is_review_pass OR p.is_review_pass IS NULL)",
        ].join(" AND ")}))`,
      );

      if (commentId) {
        where.push(`c.id=${v(commentId)}`);
      } else {
        if (postId) {
          where.push(`c.post_id=${v(postId)}`, `c.root_comment_id IS NULL`);
        } else if (parentCommentId) {
          where.push(`c.root_comment_id =${v(parentCommentId)}`);
        } else {
          throw new HttpError(400, "必须指定 postId、parentCommentId 或 commentId 之一");
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
      const postItem = currUser as NonNullable<PostCommentDto["curr_user"]>;
      if (weight) {
        postItem.is_like = weight > 0; // 是否点赞
        postItem.is_report = weight < 0; // 是否举报
      }
    }
  });
  const list = raw as PostCommentDto[];
  const first = list[0];
  const lastItem = list[list.length - 1];
  return {
    has_more: list.length >= number,
    before_cursor: first ? toTimestampCursor({ timestamp: first.create_time, id: first.comment_id }) : undefined,
    next_cursor: lastItem ? toTimestampCursor({ timestamp: lastItem.create_time, id: lastItem.comment_id }) : undefined,
    items: list,
  };
}
