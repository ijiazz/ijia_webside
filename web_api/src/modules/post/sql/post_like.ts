import { post, post_comment, post_comment_like, post_like, user_profile } from "@ijia/data/db";
import v, { dbPool } from "@ijia/data/yoursql";
import { DEFAULT_LIKE_WEIGHT } from "./const.ts";

export async function setPostLike(postId: number, userId: number): Promise<number> {
  const sqlText = `
    WITH changed_record AS (
    ${post_like
      .insert(
        "weight, post_id, user_id",
        post
          .select([`${v(DEFAULT_LIKE_WEIGHT)} as weight`, "id AS post_id", `${v(userId)} AS user_id`]) // 如果改为插入多个，只需更改这个语句
          .where([`id=${v(postId)}`, `(NOT is_delete)`, `(user_id=${v(userId)} OR NOT is_hide)`])
          .toString(),
      )
      .onConflict(["post_id", "user_id"])
      .doNotThing()
      .returning(["post_id", "user_id"])
      .toString()}
    ), update_post AS (
      UPDATE ${post.name} SET like_count = like_count + c.count
      FROM (SELECT post_id, count(*) FROM changed_record GROUP BY post_id) AS c
      WHERE ${post.name}.id = c.post_id
      RETURNING id AS post_id, ${post.name}.user_id AS user_id
    ), user_stat AS (
      SELECT 
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
      ON u.user_id = author.user_id
    ), update_user_stat AS(
      UPDATE ${user_profile.name}
      SET post_like_count = ${user_profile.name}.post_like_count + user_stat.post_like_count,
          post_like_get_count = ${user_profile.name}.post_like_get_count + user_stat.post_like_get_count
      FROM user_stat
      WHERE ${user_profile.name}.user_id = user_stat.user_id
    )
    SELECT COUNT(*)::INT FROM changed_record
  `;

  const { count } = await dbPool.queryFirstRow<{ count: number }>(sqlText);
  return count;
}

export async function cancelPostLike(postId: number, userId: number) {
  const sql = `WITH changed_record AS (
  ${post_like
    .delete({ where: [`post_id=${v(postId)}`, `user_id=${v(userId)}`, "weight>0"] })
    .returning(["post_id", "user_id"])
    .toString()}
  ), update_post AS(
    UPDATE ${post.name} SET like_count = like_count - c.count
    FROM (SELECT post_id, count(*) FROM changed_record GROUP BY post_id) AS c
    WHERE ${post.name}.id = c.post_id
    RETURNING id AS post_id, ${post.name}.user_id AS user_id, is_delete
  ), user_stat AS (
     SELECT 
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
    ON u.user_id = author.user_id
  ), update_user_stat AS (
    UPDATE ${user_profile.name} SET 
      post_like_count = ${user_profile.name}.post_like_count - user_stat.post_like_count,
      post_like_get_count = ${user_profile.name}.post_like_get_count - user_stat.post_like_get_count
    FROM user_stat
    WHERE ${user_profile.name}.user_id = user_stat.user_id
  )
  SELECT COUNT(*)::INT FROM changed_record
  `;
  const { count } = await dbPool.queryFirstRow<{ count: number }>(sql);

  return count;
}

export async function setCommentLike(commentId: number, userId: number) {
  const sql = `
    WITH insert AS(
    ${post_comment_like
      .insert("weight, comment_id, user_id", () => {
        return post_comment
          .select([`${v(DEFAULT_LIKE_WEIGHT)} as weight`, "id AS comment_id", `${v(userId)} AS user_id`])
          .where([`id=${v(commentId)}`, `(NOT is_delete)`])
          .toString();
      })
      .onConflict(["comment_id", "user_id"])
      .doNotThing()
      .returning("comment_id")}
    ), update_comment_stat AS(
      UPDATE ${post_comment.name} SET
        like_count=like_count + 1
      FROM insert
      WHERE insert.comment_id =  ${post_comment.name}.id
      RETURNING post_id
    )
    SELECT count(*)::INT FROM insert
  `;
  const { count } = await dbPool.queryFirstRow<{ count: number }>(sql);

  return count;
}

export async function cancelCommentLike(commentId: number, userId: number): Promise<number> {
  const sql = `
    WITH updated AS (
      ${post_comment_like
        .delete({
          where: [`comment_id=${v(commentId)}`, `user_id=${v(userId)}`],
        })
        .returning(["comment_id"])}
    ), update_comment_stat AS(
      UPDATE ${post_comment.name} SET
        like_count=like_count - 1
      FROM updated
      WHERE updated.comment_id =  ${post_comment.name}.id
      RETURNING post_id
    )
    SELECT count(*)::INT FROM updated
  `;
  const { count } = await dbPool.queryFirstRow<{ count: number }>(sql);

  return count;
}
