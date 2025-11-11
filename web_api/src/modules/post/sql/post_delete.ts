import { v } from "@/sql/utils.ts";
import { dbPool } from "@ijia/data/dbclient";

/**
 * 将帖子标记为删除
 * 更新作者的帖子总数
 * 更新作者的总获赞数
 */
export async function deletePost(postId: number, userId: number | null = null) {
  const { count } = await dbPool.queryFirstRow<{ count: number }>(
    v.gen`SELECT post_delete(${postId}, ${userId}) AS count`,
  );
  return count;
}
