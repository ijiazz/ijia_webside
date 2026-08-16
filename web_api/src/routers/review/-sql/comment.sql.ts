import { dbPool } from "@/db/client.ts";
import { HttpError } from "@/common/errors.ts";
import { v } from "@/sql/utils.ts";
import type { QueryableDataSQL } from "@asla/pg";

export type CommitCommentReviewParam = {
  reviewId: number;
  isPass: boolean;
  reviewerId?: number;
  remark?: string;
};
export async function commitCommentReview(param: CommitCommentReviewParam): Promise<number> {
  const { reviewId, isPass, reviewerId, remark } = param;
  const res = await dbPool.queryFirstRow(
    `SELECT review_comment_commit(${v(reviewId)}, ${v(isPass)}, ${v(reviewerId || null)}, ${v(remark || null)}) AS count`,
  ); // check exist
  if (res.count !== 1) {
    throw new HttpError(400, "审核项不存在或已被处理");
  }
  return res.count;
}
export function setCommentToReviewing(commentId: number): QueryableDataSQL<{ review_id: number }, number> {
  return dbPool.createQueryableSQL<{ review_id: number }, number>(
    `SELECT review_comment_set_to_reviewing(${v(commentId)}) AS review_id`,
    async (queryable, sql) => {
      const { review_id } = await queryable.queryFirstRow<{ review_id: number }>(sql);
      return review_id;
    },
  );
}
