import { dbPool } from "@/db/client.ts";
import { CreateCommentData, CreateCommentItemData } from "@/dto.ts";
import { HttpError } from "@/global/errors.ts";
import { v } from "@/sql/utils.ts";
import { select } from "@asla/yoursql";

export async function createComment(
  postId: number,
  userId: number,
  paramList: CreateCommentItemData[],
): Promise<CreateCommentData[]> {
  const commentTable = "post_comment";

  const insertRaw = select([
    "data.content_text",
    `p.id AS post_id`,
    `${v(userId)} AS user_id`,
    `parent.id AS parent_comment_id`,
    `(CASE WHEN parent.root_comment_id IS NULL THEN parent.id ELSE parent.root_comment_id END) AS root_comment_id`,
  ])
    .from(() => {
      return v
        .createExplicitValues(
          paramList.map((item) => ({
            content_text: item.text,
            parent_comment_id: item.replyCommentId,
          })),
          {
            content_text: "TEXT",
            parent_comment_id: "INT",
          },
        )
        .toSelect("data");
    })
    .innerJoin("public.post", {
      as: "p",
      // 只有符合条件的帖子才可以添加评论
      on: [
        `p.id=${v(postId)}`,
        `NOT p.is_delete`, // 帖子未被删除
        `p.reviewing_id IS NULL`, // 审核通过的或未审核的帖子 (排除审核中和审核不通过的帖子)
        `NOT p.is_hide`, // 帖子未设置仅作者可见
      ],
    })
    .leftJoin("post_comment", { as: "parent", on: `parent.id=data.parent_comment_id` })
    .where([
      `(data.parent_comment_id IS NULL OR NOT parent.is_delete)`, //如果是回复，需要确保父评论未被删除
      `(get_bit(p.options, 1)='0' OR p.user_id=${v(userId)})`, //如果已关闭评论区，只有帖子作者能创建评论 //TODO: 这个放到 insert 来判断比较好，现在这种没法返回 403
    ]);

  const sqlText = `WITH data AS (
      ${insertRaw.toSelect()}
    ), inserted AS (
      INSERT INTO ${commentTable}(${["content_text", "post_id", "user_id", "parent_comment_id", "root_comment_id"].join(", ")})
      SELECT * FROM data 
      RETURNING id, post_id, parent_comment_id, root_comment_id 
    ), update_post AS (
      UPDATE public.post SET
        comment_num = comment_num + post_count.count
      FROM (
         SELECT post_id, count(*) as count FROM inserted GROUP BY post_id
      ) AS post_count
      WHERE public.post.id = post_count.post_id
      RETURNING public.post.id
    ), group_cid AS (
      SELECT parent_comment_id AS id, 0 AS root_add_count, count(*) AS parent_add_count FROM inserted
      WHERE parent_comment_id IS NOT NULL
      GROUP BY parent_comment_id
      UNION ALL
      SELECT root_comment_id AS id, count(*) AS root_add_count, 0 AS parent_add_count FROM inserted
      WHERE root_comment_id IS NOT NULL
      GROUP BY root_comment_id
    ),update_parent AS (
      UPDATE ${commentTable} AS c
      SET
        reply_count = c.reply_count + update_parent.parent_add_count,
        is_root_reply_count = c.is_root_reply_count + update_parent.root_add_count
      FROM (
        SELECT 
          id, SUM(root_add_count) AS root_add_count, SUM(parent_add_count) AS parent_add_count
        FROM group_cid GROUP BY id
      ) AS update_parent
      WHERE c.id = update_parent.id
      RETURNING c.id, c.reply_count
    )
    
    SELECT id FROM inserted
  `;

  const res = await dbPool.queryRows<CreateCommentData>(sqlText);
  if (res.length === 0) {
    throw new HttpError(404, "无法创建评论，可能是帖子不存在或已被删除，或者是审核中");
  }
  return res;
}

/** 获取指定用户是否能发布评论 */
export async function getUserCanCreateCommentLimit(userId: number, second: number = 2) {
  if (typeof second !== "number" || second <= 0) {
    throw new Error("second 必须是大于0的数字");
  }
  const list = await dbPool.queryRows(
    select({ create_time: true, id: true })
      .from("post_comment")
      .where([`user_id=${v(userId)}`, `now() - create_time < interval ' ${second} second'`])
      .limit(1),
  );

  return list.length === 0;
}
/** 删除 commentId 以及所有子评论，更新父级评论回复数和跟评论回复总数 */
export async function recursiveDeleteComment(commentId: number, userId: number) {
  const deleteInfo = await dbPool.queryFirstRow<{
    deleted_total: number;
    can_delete_total: number;
    need_delete: { post_user_id: number; comment_user_id: number }[];
  }>(`SELECT * FROM post_recursive_delete_comment(${v(commentId)}, ${v(userId)})`);

  if (!deleteInfo.can_delete_total) throw new HttpError(404, `id 为 ${commentId} 的评论不存在`);
}
/**
 *
 * 用户可以删除自己的评论。
 * 帖子作者可以删除所有评论
 */
export async function deleteComment(commentId: number, userId: number) {
  const deleteInfo = await dbPool.queryFirstRow<{ count: number }>(
    `SELECT post_delete_comment(${v(commentId)}, ${v(userId)}) as count`,
  );

  if (!deleteInfo.count) throw new HttpError(404, `id 为 ${commentId} 的评论不存在`);
}
