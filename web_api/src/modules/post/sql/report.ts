import {
  post,
  post_comment,
  post_comment_like,
  post_review_info,
  post_like,
  PostReviewType,
  user_profile,
} from "@ijia/data/db";
import { dbPool } from "@ijia/data/dbclient";
import { DEFAULT_REPORT_WEIGHT, REPORT_THRESHOLD } from "./const.ts";
import { HttpError } from "@/global/errors.ts";
import { v } from "@/sql/utils.ts";
import { insertInto, select, update } from "@asla/yoursql";
export async function setPostToReviewing(postId: number): Promise<string> {
  const sqlText = `WITH need_add_review AS (${update(post.name)
    .set({ is_reviewing: v(true) })
    .where([`id=${v(postId)}`, "NOT is_delete", `NOT is_reviewing`])
    .returning("id AS post_id")
    .toString()}
  )
  INSERT INTO ${post_review_info.name} (type, target_id)
  SELECT ${v(PostReviewType.post)}, post_id FROM need_add_review
  ON CONFLICT (type, target_id) DO
  UPDATE SET is_review_pass = NULL
  `;
  await dbPool.queryCount(sqlText);

  return `${PostReviewType.post}-${postId}`;
}
export async function setPostCommentToReviewing(commentId: number): Promise<string> {
  await insertInto(post_review_info.name, ["type", "target_id"])
    .select(
      select([v(PostReviewType.postComment), "id"])
        .from(post_comment.name)
        .where([`id=${v(commentId)}`, "NOT is_delete"])
        .genSql(),
    )
    .onConflict("type, target_id")
    .doNotThing()
    .client(dbPool);
  return `${PostReviewType.postComment}-${commentId}`;
}
export async function reportPost(postId: number, userId: number, reason?: string): Promise<number> {
  const sql = `WITH old AS(
    ${select(["weight"])
      .from(post_like.name)
      .where([`post_id=${v(postId)}`, `user_id=${v(userId)}`])
      .genSql()}
  ), insert_report AS (
  ${insertInto(post_like.name, ["weight", "post_id", "user_id", "reason"])
    .select(
      select([
        `${v(DEFAULT_REPORT_WEIGHT)} AS weight`,
        "p.id AS post_id",
        `${v(userId)} AS user_id`,
        `${reason ? v(reason) : "NULL"} AS reason`,
      ])
        .from(post.name, { as: "p" })
        .where([`id=${v(postId)}`, `(NOT is_delete)`])
        .toString(),
    )
    .onConflict(["post_id", "user_id"])
    .doNotThing()
    .returning(["post_id", "user_id", "weight"])
    .toString()}
  ), count_data AS (
    SELECT insert_report.post_id, (${getReportWeight("insert_report.user_id", REPORT_THRESHOLD)}) AS weight FROM insert_report
  ), update_post_count AS (
    UPDATE ${post.name} SET 
      dislike_count = dislike_count + count_data.weight,
      is_reviewing = (CASE WHEN (is_review_pass IS NULL AND (dislike_count + count_data.weight) >=${v(REPORT_THRESHOLD)}) 
        THEN TRUE ELSE is_reviewing
        END
      )
    FROM count_data
    WHERE ${post.name}.id = count_data.post_id
    RETURNING post_id, is_reviewing, dislike_count
  ), insert_reviewing AS (
    INSERT INTO ${post_review_info.name} (type, target_id)
    SELECT ${v(PostReviewType.post)}, post_id FROM update_post_count
    WHERE is_reviewing
    RETURNING target_id
  )
  SELECT COUNT(*)::INT,
    (SELECT weight FROM old) AS old_weight,
    (SELECT weight FROM insert_report) AS report_weight,
    (SELECT COUNT(*)::INT FROM insert_reviewing) AS new_reviewing_count
  FROM insert_report
  `;

  const r2 = await dbPool.queryFirstRow<{ count: number; old_weight: number; new_reviewing_count: number }>(sql);
  if (r2.old_weight !== null) {
    if (r2.old_weight > 0) throw new HttpError(400, "请取消点赞后再举报");
  }
  return r2.count;
}

export async function reportComment(commentId: number, userId: number, reason?: string): Promise<number> {
  const sql = `WITH old AS(
    ${select(["weight"])
      .from(post_comment_like.name)
      .where([`comment_id=${v(commentId)}`, `user_id=${v(userId)}`])
      .toString()}
  ), insert_report AS (
  ${insertInto(post_comment_like.name, ["weight", "comment_id", "user_id", "reason"])
    .select(
      select([
        `${v(DEFAULT_REPORT_WEIGHT)} AS weight`,
        "p.id AS comment_id",
        `${v(userId)} AS user_id`,
        `${reason ? v(reason) : "NULL"} AS reason`,
      ])
        .from(post_comment.name, { as: "p" })
        .where([`id=${v(commentId)}`, `(NOT is_delete)`])
        .toString(),
    )
    .onConflict(["comment_id", "user_id"])
    .doNotThing()
    .returning(["comment_id", "user_id"])
    .toString()}
  ), count_data AS (
    SELECT insert_report.comment_id, (${getReportWeight("insert_report.user_id", REPORT_THRESHOLD)}) AS weight FROM insert_report
  ), update_count AS (
    UPDATE ${post_comment.name} SET 
      dislike_count = dislike_count + count_data.weight
    FROM count_data
    WHERE ${post_comment.name}.id = count_data.comment_id
    RETURNING comment_id, dislike_count
  ), add_reviewing AS (
  ${insertInto(post_review_info.name, ["type", "target_id"])
    .select(
      select([v(PostReviewType.postComment), "comment_id"])
        .from("update_count")
        .where(`update_count.dislike_count >=${v(REPORT_THRESHOLD)}`)
        .genSql(),
    )
    .onConflict("type, target_id")
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
function getReportWeight(userId: string, threshold: number) {
  const defaultWeight = Math.ceil(threshold / 3);
  return select(
    `CASE 
        WHEN report_correct_count + report_error_count = 0
          THEN ${defaultWeight} 
        WHEN report_correct_count = 0
          THEN ${defaultWeight} / (report_error_count + 1)
        ELSE (report_correct_count * 100) / (report_correct_count + report_error_count)
      END`,
  )
    .from(user_profile.name)
    .where(`user_id=${userId}`)
    .genSql();
}
