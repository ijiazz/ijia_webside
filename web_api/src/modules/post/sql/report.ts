import {
  post,
  post_comment,
  post_comment_like,
  post_comment_review_result,
  post_like,
  user_profile,
} from "@ijia/data/db";
import v, { dbPool, Selection } from "@ijia/data/yoursql";
import { REPORT_THRESHOLD } from "./const.ts";
import { HttpError } from "@/global/errors.ts";

export async function reportPost(postId: number, userId: number, reason?: string): Promise<number> {
  const sql = `WITH old AS(
    ${post_like
      .select(["weight"])
      .where([`post_id=${v(postId)}`, `user_id=${v(userId)}`])
      .toString()}
  ), insert_report AS (
  ${post_like
    .insert(
      "weight, post_id, user_id, reason",
      post
        .fromAs("p")
        .select([
          `(${getReportWeight(userId)}) AS weight`,
          "p.id AS post_id",
          `${v(userId)} AS user_id`,
          `${reason ? v(reason) : "NULL"} AS reason`,
        ])
        .where([`id=${v(postId)}`, `(NOT is_delete)`])
        .toString(),
    )
    .onConflict(["post_id", "user_id"])
    .doNotThing()
    .returning(["post_id", "user_id", "weight"])
    .toString()}
  ), update_post_count AS (
    UPDATE ${post.name} SET 
      dislike_count = dislike_count - insert_report.weight,
      is_reviewing = (CASE WHEN (is_review_pass IS NULL AND (dislike_count - insert_report.weight) >=${v(REPORT_THRESHOLD)}) 
        THEN TRUE ELSE is_reviewing
        END
      )
    FROM insert_report
    WHERE ${post.name}.id = insert_report.post_id
  )
  SELECT COUNT(*)::INT, (SELECT weight FROM old) AS old_weight, (SELECT weight FROM insert_report) AS report_weight FROM insert_report
  `;

  const r2 = await dbPool.queryFirstRow<{ count: number; old_weight: number }>(sql);
  if (r2.old_weight !== null) {
    if (r2.old_weight > 0) throw new HttpError(400, "请取消点赞后再举报");
  }
  return r2.count;
}

export async function reportComment(commentId: number, userId: number, reason?: string): Promise<number> {
  const sql = `WITH old AS(
    ${post_comment_like
      .select(["weight"])
      .where([`comment_id=${v(commentId)}`, `user_id=${v(userId)}`])
      .toString()}
  ), insert_report AS (
  ${post_comment_like
    .insert(
      "weight, comment_id, user_id, reason",
      post_comment
        .fromAs("p")
        .select([
          `(${getReportWeight(userId)}) AS weight`,
          "p.id AS comment_id",
          `${v(userId)} AS user_id`,
          `${reason ? v(reason) : "NULL"} AS reason`,
        ])
        .where([`id=${v(commentId)}`, `(NOT is_delete)`])
        .toString(),
    )
    .onConflict(["comment_id", "user_id"])
    .doNotThing()
    .returning(["comment_id", "user_id", "weight"])
    .toString()}
  ), update_count AS (
    UPDATE ${post_comment.name} SET 
      dislike_count = dislike_count - insert_report.weight
    FROM insert_report
    WHERE ${post_comment.name}.id = insert_report.comment_id
    RETURNING comment_id, dislike_count
  ), update_reviewing AS (
  ${post_comment_review_result
    .insert(
      "comment_id",
      Selection.from("update_count")
        .select("comment_id")
        .where(`update_count.dislike_count >=${v(REPORT_THRESHOLD)}`)
        .genSql(),
    )
    .onConflict("comment_id")
    .doNotThing()
    .genSql()}
  )
  SELECT COUNT(*)::INT, (SELECT weight FROM old) AS old_weight FROM insert_report
  `;

  const r2 = await dbPool.queryFirstRow<{ count: number; old_weight: number }>(sql);
  if (r2.old_weight !== null) {
    if (r2.old_weight > 0) throw new HttpError(400, "请取消点赞后再举报");
  }
  return r2.count;
}
function getReportWeight(userId: number) {
  return user_profile
    .select(
      `CASE WHEN report_correct_count + report_error_count = 0
        THEN -100 
        ELSE - (report_correct_count * 100) / (report_correct_count + report_error_count)
      END`,
    )
    .where(`user_id=${v(userId)}`)
    .genSql();
}
