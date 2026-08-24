import { dbPool } from "@/db/client.ts";
import { DEFAULT_LIKE_WEIGHT, DEFAULT_REPORT_WEIGHT, REPORT_THRESHOLD } from "@/common/const.ts";
import { HttpError } from "@/common/errors.ts";
import { v } from "@/sql/utils.ts";
import { deleteFrom, insertInto, select, update } from "@asla/yoursql";
import { setCommentToReviewing } from "@/routers/review/mod.ts";
import { ReviewStatus } from "@ijia/school-db/db";

export async function reportComment(commentId: number, userId: number, reason?: string): Promise<number> {
  const oldWeight = select(["weight"])
    .from("comment_like")
    .where([`comment_id=${v(commentId)}`, `user_id=${v(userId)}`]);

  const sql = `WITH insert_report AS (
  ${insertInto("comment_like", ["weight", "comment_id", "user_id", "reason"])
    .select(() =>
      select([
        `${v(DEFAULT_REPORT_WEIGHT)} AS weight`,
        "id AS comment_id",
        `${v(userId)} AS user_id`,
        `${v(reason ?? null)} AS reason`,
      ])
        .from("comment")
        .where([`id=${v(commentId)}`, "NOT is_delete"])
        .toString(),
    )
    .onConflict(["comment_id", "user_id"])
    .doNotThing()
    .returning(["comment_id", "user_id", "weight"])
    .toString()}
  )
  ${update("comment")
    .set({ dislike_count: `dislike_count - insert_report.weight` })
    .from("insert_report")
    .where(`id=insert_report.comment_id`)
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
      await t.execute(setCommentToReviewing(row.id));
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

export async function setCommentLike(commentId: number, userId: number) {
  const sql = `
    WITH insert AS(
    ${insertInto("comment_like", ["weight", "comment_id", "user_id"])
      .select(() => {
        return select([`${v(DEFAULT_LIKE_WEIGHT)} as weight`, "id AS comment_id", `${v(userId)} AS user_id`])
          .from("comment")
          .where([`id=${v(commentId)}`, `(NOT is_delete)`])
          .toString();
      })
      .onConflict(["comment_id", "user_id"])
      .doNotThing()
      .returning("comment_id")}
    ), update_comment_stat AS(
      UPDATE comment SET
        like_count=like_count + 1
      FROM insert
      WHERE insert.comment_id = comment.id
      RETURNING comment.id
    )
    SELECT count(*)::INT FROM insert
  `;
  const { count } = await dbPool.queryFirstRow<{ count: number }>(sql);

  return count;
}
export async function cancelCommentLike(commentId: number, userId: number): Promise<number> {
  const sql = `
    WITH updated AS (
      ${deleteFrom("comment_like")
        .where([`comment_id=${v(commentId)}`, `user_id=${v(userId)}`])
        .returning(["comment_id"])}
    ), update_comment_stat AS(
      UPDATE comment SET
        like_count=like_count - 1
      FROM updated
      WHERE updated.comment_id = comment.id
      RETURNING comment.id
    )
    SELECT count(*)::INT FROM updated
  `;
  const { count } = await dbPool.queryFirstRow<{ count: number }>(sql);

  return count;
}
