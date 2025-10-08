import v, { dbPool } from "@ijia/data/yoursql";

/**
 * 将帖子标记为删除
 * 更新作者的帖子总数
 * 更新作者的总获赞数
 */
export async function deletePost(postId: number, userId: number | null = null) {
  const { count } = await dbPool.queryFirstRow<{ count: number }>(
    `SELECT post_delete(${v(postId)}, ${v(userId)}) AS count`,
  );
  return count;
}
