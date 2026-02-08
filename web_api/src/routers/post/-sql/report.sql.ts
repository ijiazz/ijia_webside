import { dbPool } from "@/db/client.ts";
import { DEFAULT_REPORT_WEIGHT, REPORT_THRESHOLD } from "../-utils/const.ts";
import { HttpError } from "@/global/errors.ts";
import { insertIntoValues, v } from "@/sql/utils.ts";
import { select, update } from "@asla/yoursql";
import { setPostCommentToReviewing, setPostToReviewing } from "@/routers/review/mod.ts";
import { ReviewStatus } from "@ijia/data/db";

export async function reportPost(postId: number, userId: number, reason?: string): Promise<number> {
  const oldWeight = select(["weight"])
    .from("post_like")
    .where([`post_id=${v(postId)}`, `user_id=${v(userId)}`]);

  const sql = `WITH insert_report AS (
    ${insertIntoValues("post_like", {
      post_id: postId,
      user_id: userId,
      weight: DEFAULT_REPORT_WEIGHT,
      reason: reason || null,
    })
      .onConflict(["post_id", "user_id"])
      .doNotThing()
      .returning(["post_id", "user_id", "weight"])
      .toString()}
  )
  ${update("public.post")
    .set({ dislike_count: `dislike_count - insert_report.weight` })
    .from("insert_report")
    .where(`id=insert_report.post_id AND NOT is_delete`)
    .returning(["id ", "review_id", "dislike_count"])
    .toString()}
  `;
  await using t = dbPool.begin();
  const [o1, insertRecordRes] = await t.query([oldWeight, sql]);
  if (insertRecordRes.rows?.length) {
    const row = insertRecordRes.rows[0] as {
      id: number;
      review_id: number | null;
      dislike_count: number;
    };
    const isReviewPass = row.review_id !== null;
    if (!isReviewPass && row.dislike_count >= REPORT_THRESHOLD) {
      await t.queryCount(setPostToReviewing(row.id));
    }
  } else {
    if (o1.rows?.[0]) {
      throw new HttpError(400, "请取消点赞后再举报");
    } else {
      throw new HttpError(400, "帖子不存在");
    }
  }

  await t.commit();
  return 1;
}

export async function reportComment(commentId: number, userId: number, reason?: string): Promise<number> {
  const oldWeight = select(["weight"])
    .from("post_comment_like")
    .where([`comment_id=${v(commentId)}`, `user_id=${v(userId)}`]);

  const sql = `WITH insert_report AS (
  ${insertIntoValues("post_comment_like", {
    weight: DEFAULT_REPORT_WEIGHT,
    comment_id: commentId,
    user_id: userId,
    reason: reason,
  })
    .onConflict(["comment_id", "user_id"])
    .doNotThing()
    .returning(["comment_id", "user_id", "weight"])
    .toString()}
  )
  ${update("post_comment")
    .set({ dislike_count: `dislike_count - insert_report.weight` })
    .from("insert_report")
    .where(`id=insert_report.comment_id AND NOT is_delete`)
    .returning(["id", "review_status", "dislike_count"])
    .toString()}
  `;

  await using t = dbPool.begin();
  const [o1, insertRecordRes] = await t.query([oldWeight, sql]);
  if (insertRecordRes.rows?.length) {
    const row = insertRecordRes.rows[0] as {
      id: number;
      review_status: ReviewStatus | null;
      dislike_count: number;
    };
    if (row.review_status === null && row.dislike_count >= REPORT_THRESHOLD) {
      await t.execute(setPostCommentToReviewing(row.id));
    }
  } else {
    if (o1.rows?.[0]) {
      throw new HttpError(400, "请取消点赞后再举报");
    } else {
      throw new HttpError(400, "评论不存在");
    }
  }

  await t.commit();
  return 1;
}
