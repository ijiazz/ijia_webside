import { dbPool } from "@/db/client.ts";
import { GetPostListParam, Post, PublicPost, CursorListDto, GetUserPostListParam } from "@/dto.ts";
import { v } from "@/sql/utils.ts";
import { createSelect, getCursor, getCursorCondition, initRawList } from "./_post_list_raw.sql.ts";

const PUBLIC_EXCLUDE = `(p.publish_time IS NULL OR review_status_is_progress(p.review_status) OR p.is_hide)`; // 审核中和审核不通过和已隐藏

export async function getPublicPostList(
  params: GetPostListParam = {},
  option: { currentUserId?: number } = {},
): Promise<CursorListDto<PublicPost, string>> {
  const { number = 10, cursor: cursorStr, userId, group_id, post_id, forward, s_content, s_author } = params;
  const { currentUserId = null } = option;

  const qSql = createSelect(currentUserId)
    .where(() => {
      const where: string[] = [`NOT p.is_delete`];
      where.push(`(NOT ${PUBLIC_EXCLUDE})`);
      if (typeof userId === "number") where.push(`p.user_id =${v(userId)}`);

      if (group_id !== undefined) where.push(`p.group_id =${v(group_id)}`);
      if (post_id !== undefined) where.push(`p.id = ${v(post_id)}`);
      if (cursorStr) {
        where.push(getCursorCondition(cursorStr, forward));
      }

      return where;
    })
    .orderBy(forward ? ["p.publish_time ASC NULLS LAST", "p.id ASC"] : ["p.publish_time DESC NULLS FIRST", "p.id DESC"])
    .limit(number);

  /**
   *  使用指针分页
   *  使用 publish_time 和 id 作为指针
   *  因为 publish_time 可能为 null，如果 publish_time 为 null，仅使用 id 作为指针
   */
  const rawList = await dbPool.queryRows(qSql);
  const { cursor_next, cursor_prev } = getCursor(rawList);
  return { items: initRawList(rawList), cursor_next, cursor_prev };
}

export async function getPost(postId: number, currentUserId: number | null): Promise<Post | undefined> {
  const qSql = createSelect(currentUserId)
    .where(() => {
      const where: string[] = [`NOT p.is_delete`, `p.id=${v(postId)}`];

      where.push(`(p.user_id=${v(currentUserId)} OR NOT ${PUBLIC_EXCLUDE})`);

      return where;
    })
    .limit(1);
  const rawList = await dbPool.queryRows(qSql);
  return initRawList(rawList)[0];
}

/** 获取用户主页自己的帖子列表 */
export async function getSelfPostList(
  userId: number,
  params: GetUserPostListParam = {},
): Promise<CursorListDto<Post, string>> {
  const { number = 10, cursor: cursorStr, group_id, post_id, forward } = params;

  const qSql = createSelect(userId)
    .where(() => {
      const where: string[] = [`NOT p.is_delete`];

      where.push(`p.user_id=${v(userId)}`);

      if (group_id !== undefined) where.push(`p.group_id =${v(group_id)}`);
      if (post_id !== undefined) where.push(`p.id = ${v(post_id)}`);
      if (cursorStr) {
        where.push(getCursorCondition(cursorStr, forward));
      }

      return where;
    })
    .orderBy(forward ? ["p.publish_time ASC NULLS LAST", "p.id ASC"] : ["p.publish_time DESC NULLS FIRST", "p.id DESC"])
    .limit(number);

  /**
   *  使用指针分页
   *  使用 publish_time 和 id 作为指针
   *  因为 publish_time 可能为 null，如果 publish_time 为 null，仅使用 id 作为指针
   */
  const rawList = await dbPool.queryRows(qSql);
  const { cursor_next, cursor_prev } = getCursor(rawList);
  return { items: initRawList(rawList), cursor_next, cursor_prev };
}
