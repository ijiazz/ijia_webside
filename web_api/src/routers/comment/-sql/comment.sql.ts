import { dbPool } from "@/db/client.ts";
import { HttpError } from "@/common/errors.ts";
import { v } from "@/sql/utils.ts";
import { select } from "@asla/yoursql";
import { CommentGroup, DbCommentTree } from "@ijia/school-db/db";

/** 获取指定用户是否能发布评论 */
export async function getUserCanCreateCommentLimit(userId: number, second: number = 2) {
  if (typeof second !== "number" || second <= 0) {
    throw new Error("second 必须是大于0的数字");
  }
  const list = await dbPool.queryRows(
    select(["create_time", "id"])
      .from("comment")
      .where([`user_id=${v(userId)}`, `now() - create_time < interval ' ${second} second'`])
      .limit(1),
  );

  return list.length === 0;
}

/**
 *
 * 用户可以删除自己的评论。
 * 帖子作者可以删除所有评论
 */
export async function deleteComment(commentId: number, userId: number) {
  const { count } = await dbPool.queryFirstRow<{ count: number }>(
    v.gen`SELECT comment_delete(${commentId}, ${userId}) AS count`,
  );
  if (count === 0) throw new HttpError(404, `id 为 ${commentId} 的评论不存在`);
}
export async function checkCanCreate(
  commentTreeId: number,
  userId: number,
): Promise<{ canCreate: boolean; reason?: string }> {
  const [res] = await dbPool.queryRows<Pick<DbCommentTree, "group_type" | "owner_id">>(
    v.gen`SELECT group_type, owner_id FROM comment_tree WHERE id=${commentTreeId} LIMIT 1`,
  );
  if (!res) return { canCreate: false, reason: "评论区不存在" };

  switch (res.group_type) {
    case CommentGroup.Post: {
      const [result] = await dbPool.queryRows<{
        is_hide: boolean;
        review_unavailable: boolean;
        comment_disabled: boolean;
      }>(v.gen`
        SELECT
          is_hide,
          review_status_is_progress(review_status) AS review_unavailable,
          get_bit(options, 1)::BOOL AS comment_disabled
        FROM post
        WHERE comment_tree_id=${commentTreeId} AND NOT is_delete`);
      if (!result) {
        return { canCreate: false, reason: "帖子不存在或已被删除" };
      }
      if (result.is_hide || result.review_unavailable) {
        return { canCreate: false, reason: "帖子不存在或已被删除" };
      }
      if (result.comment_disabled && userId !== res.owner_id) {
        return { canCreate: false, reason: "作者已关闭评论功能" };
      }
      return { canCreate: true };
    }

    default:
      return { canCreate: true };
  }
}
