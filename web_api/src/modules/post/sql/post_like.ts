import { post, post_comment, post_comment_like, post_like } from "@ijia/data/db";
import v, { dbPool } from "@ijia/data/yoursql";
import { DEFAULT_LIKE_WEIGHT, REPORT_THRESHOLD } from "./const.ts";

export async function setPostLike(postId: number, userId: number) {
  const insertRecord = post_like
    .insert("weight, post_id, user_id", () => {
      return post
        .select([`${v(DEFAULT_LIKE_WEIGHT)} as weight`, "id AS post_id", `${v(userId)} AS user_id`])
        .where([`id=${v(postId)}`, `(NOT is_delete)`, `(user_id=${v(userId)} OR NOT is_hide)`])
        .toString();
    })
    .onConflict(["post_id", "user_id"])
    .doNotThing()
    .returning("1");

  // 成功插入更新计数
  const updateCount = post
    .update({ like_count: "like_count + 1" })
    .where([`id=${v(postId)}`, `EXISTS (SELECT 1 FROM tmp)`]);

  const count = await dbPool.queryCount(`WITH tmp AS (${insertRecord})\n${updateCount.toString()}`);

  return count;
}

function cancelPostLikeSql(postId: number, userId: number) {
  const deleteRecord = post_like
    .delete({ where: [`post_id=${v(postId)}`, `user_id=${v(userId)}`, "weight>0"] })
    .returning("1");
  // 成功删除则更新计数
  const updateCount = post
    .update({ like_count: "like_count - 1" })
    .where([`id=${v(postId)}`, `EXISTS (SELECT 1 FROM tmp)`]);
  const sql = `WITH tmp AS (${deleteRecord})\n${updateCount.toString()}`;

  return sql;
}
export async function cancelPostLike(postId: number, userId: number) {
  const sql = cancelPostLikeSql(postId, userId);
  return dbPool.queryCount(sql);
}
export async function reportPost(postId: number, userId: number, reason?: string) {
  const cancelLikeSql = cancelPostLikeSql(postId, userId);
  const insertRecord = post_like
    .insert("weight, post_id, user_id, reason", () => {
      return post
        .select([
          "-100 as weight", //todo 根据用户获取权重
          "id AS post_id",
          `${v(userId)} AS user_id`,
          `${reason ? v(reason) : "NULL"} AS reason`,
        ])
        .where([`id=${v(postId)}`, `(NOT is_delete)`])
        .toString();
    })
    .returning("1");

  const setReviewing = `(CASE 
  WHEN (is_review_pass IS NULL AND (dislike_count + 100) >=${v(REPORT_THRESHOLD)}) THEN TRUE 
  ELSE is_reviewing
  END)`;

  // 成功插入更新计数
  const updateCount = post
    .update({
      dislike_count: "dislike_count + 100", //todo 根据用户获取权重
      is_reviewing: setReviewing,
    })
    .where([`id=${v(postId)}`, `EXISTS (SELECT 1 FROM tmp)`]);

  const sql = `WITH tmp AS (${insertRecord})\n${updateCount.toString()}`;

  const [cancel, insert] = await dbPool.multipleQuery([cancelLikeSql, sql].join(";\n"));

  return insert.rowCount;
}

export async function setCommentLike(commentId: number, userId: number) {
  const insertRecord = post_comment_like
    .insert("weight, comment_id, user_id", () => {
      return post
        .select([`${v(DEFAULT_LIKE_WEIGHT)} as weight`, "id AS comment_id", `${v(userId)} AS user_id`])
        .where([`id=${v(commentId)}`, `(NOT is_delete)`, `(user_id=${v(userId)} OR NOT is_hide)`])
        .toString();
    })
    .onConflict(["comment_id", "user_id"])
    .doNotThing()
    .returning("1");

  // 成功插入更新计数
  const updateCount = post_comment
    .update({ like_count: "like_count + 1" })
    .where([`id=${v(commentId)}`, `EXISTS (SELECT 1 FROM tmp)`]);

  const count = await dbPool.queryCount(`WITH tmp AS (${insertRecord})\n${updateCount.toString()}`);

  return count;
}
