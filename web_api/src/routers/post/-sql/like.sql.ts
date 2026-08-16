import { dbPool } from "@/db/client.ts";
import { DEFAULT_LIKE_WEIGHT, DEFAULT_REPORT_WEIGHT, REPORT_THRESHOLD } from "@/common/const.ts";
import { deleteFrom, insertInto, select, update, withAs } from "@asla/yoursql";
import { insertIntoValues, v } from "@/sql/utils.ts";
import { setPostToReviewing } from "@/routers/review/mod.ts";
import { HttpError } from "@/common/errors.ts";

export async function setPostLike(postId: number, userId: number): Promise<number> {
  const base = withAs("changed_record", () =>
    insertInto("post_like", ["weight", "post_id", "user_id"])
      .select(
        select([`${v(DEFAULT_LIKE_WEIGHT)} as weight`, "id AS post_id", `${v(userId)} AS user_id`]) // 如果改为插入多个，只需更改这个语句
          .from("public.post")
          .where([`id=${v(postId)}`, `(NOT is_delete)`, `(user_id=${v(userId)} OR NOT is_hide)`])
          .toString(),
      )
      .onConflict(["post_id", "user_id"])
      .doNotThing()
      .returning(["post_id", "user_id"])
      .toString(),
  )
    .as(
      "update_post",
      `UPDATE public.post AS p SET like_count = like_count + c.count
      FROM (SELECT post_id, count(*) FROM changed_record GROUP BY post_id) AS c
      WHERE p.id = c.post_id
      RETURNING id AS post_id, p.user_id AS user_id`,
    )
    .as(
      "user_stat",
      `SELECT 
        COALESCE(u.user_id, author.user_id) AS user_id,
        COALESCE(u.count, 0) AS post_like_count,
        COALESCE(author.count, 0) AS post_like_get_count
      FROM (
        SELECT user_id, count(*)
        FROM changed_record GROUP BY user_id
      ) AS u
      FULL OUTER JOIN (
        SELECT user_id, count(*)
        FROM update_post GROUP BY user_id
      ) AS author
      ON u.user_id = author.user_id`,
    )
    .as(
      "update_user_stat",
      `UPDATE user_profile
      SET post_like_count = user_profile.post_like_count + user_stat.post_like_count,
          post_like_get_count = user_profile.post_like_get_count + user_stat.post_like_get_count
      FROM user_stat
      WHERE user_profile.user_id = user_stat.user_id`,
    )
    .toString();
  const sqlText = `${base}\nSELECT COUNT(*)::INT FROM changed_record
  `;

  const { count } = await dbPool.queryFirstRow<{ count: number }>(sqlText);
  return count;
}

export async function cancelPostLike(postId: number, userId: number) {
  const base = withAs("changed_record", () =>
    deleteFrom("post_like")
      .where([`post_id=${v(postId)}`, `user_id=${v(userId)}`, "weight>0"])
      .returning(["post_id", "user_id"])
      .toString(),
  )
    .as(
      "update_post",
      `UPDATE public.post SET like_count = like_count - c.count
      FROM (SELECT post_id, count(*) FROM changed_record GROUP BY post_id) AS c
      WHERE public.post.id = c.post_id
      RETURNING id AS post_id, public.post.user_id AS user_id, is_delete`,
    )
    .as(
      "user_stat",
      `SELECT 
      COALESCE(u.user_id, author.user_id) AS user_id,
      COALESCE(u.count, 0) AS post_like_count,
      COALESCE(author.count, 0) AS post_like_get_count
    FROM (
      SELECT user_id, count(*)
      FROM changed_record GROUP BY user_id
    ) AS u
    FULL OUTER JOIN (
      SELECT user_id, count(*)
      FROM update_post WHERE NOT is_delete
      GROUP BY user_id
    ) AS author
    ON u.user_id = author.user_id`,
    )
    .as(
      `update_user_stat`,
      `UPDATE user_profile SET 
      post_like_count = user_profile.post_like_count - user_stat.post_like_count,
      post_like_get_count = user_profile.post_like_get_count - user_stat.post_like_get_count
    FROM user_stat
    WHERE user_profile.user_id = user_stat.user_id`,
    );
  const sql = `${base}\nSELECT COUNT(*)::INT FROM changed_record
  `;
  const { count } = await dbPool.queryFirstRow<{ count: number }>(sql);

  return count;
}

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
