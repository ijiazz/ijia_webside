import { dbPool } from "@/db/client.ts";
import { HttpError } from "@/global/errors.ts";
import { v } from "@/sql/utils.ts";
import { QueryableDataSQL } from "@asla/yoursql/client";

export function setPostToReviewing(postId: number): QueryableDataSQL<{ review_id: number }, number> {
  return dbPool.createQueryableSQL<{ review_id: number }, number>(
    `SELECT review_post_set_to_reviewing(${v(postId)}) AS review_id`,
    async (queryable, sql) => {
      const { review_id } = await queryable.queryFirstRow<{ review_id: number }>(sql);
      return review_id;
    },
  );
}
export function setPostCommentToReviewing(commentId: number): QueryableDataSQL<{ review_id: number }, number> {
  return dbPool.createQueryableSQL<{ review_id: number }, number>(
    `SELECT review_post_comment_set_to_reviewing(${v(commentId)}) AS review_id`,
    async (queryable, sql) => {
      const { review_id } = await queryable.queryFirstRow<{ review_id: number }>(sql);
      return review_id;
    },
  );
}
export type CommitReviewParam = {
  reviewId: number;
  isPass: boolean;
  reviewerId?: number;
  remark?: string;
};
export async function commitPostReview(param: CommitReviewParam): Promise<number> {
  const { reviewId, isPass, reviewerId, remark } = param;
  const res = await dbPool.queryFirstRow(
    `SELECT review_post_commit(${v(reviewId)}, ${v(isPass)}, ${v(reviewerId || null)}, ${v(remark || null)}) AS count`,
  ); // check exist
  if (res.count !== 1) {
    throw new HttpError(400, "审核项不存在或已被处理");
  }
  return res.count;
}
export async function commitPostCommentReview(param: CommitReviewParam): Promise<number> {
  const { reviewId, isPass, reviewerId, remark } = param;
  const res = await dbPool.queryFirstRow(
    `SELECT review_post_comment_commit(${v(reviewId)}, ${v(isPass)}, ${v(reviewerId || null)}, ${v(remark || null)}) AS count`,
  ); // check exist
  if (res.count !== 1) {
    throw new HttpError(400, "审核项不存在或已被处理");
  }
  return res.count;
}
