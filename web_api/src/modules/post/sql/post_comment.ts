import { post, post_comment } from "@ijia/data/db";
import v, { dbPool, selectColumns, where } from "@ijia/data/yoursql";
import { CreatePostCommentParam } from "../comment.dto.ts";
import { HttpError } from "@/global/errors.ts";

export async function createComment(postId: number, userId: number, param: CreatePostCommentParam): Promise<number> {
  const { reply_comment_id } = param;

  //更新作品评论数量
  // 只有符合条件的评论可以添加评论
  const updateCommentCount = post
    .update({ comment_num: "comment_num + 1" })
    .where([`id=${v(postId)}`, `NOT is_delete`, `(NOT is_review_pass OR is_review_pass IS NULL)`, `NOT is_reviewing`])
    .returning("*")
    .toString();

  if (typeof reply_comment_id === "number") {
    //插入评论
    const insertRes = post_comment
      .insert(["root_comment_id", "parent_comment_id", "post_id", "user_id"].join(", "), () => {
        return post_comment
          .select(["root_comment_id", "id AS parent_comment_id", v(postId), v(userId)])
          .where([`NOT is_delete`, `id=${v(reply_comment_id)}`, `EXISTS postUpdated`]) // 确保父级评论状态
          .toString();
      })
      .returning(["root_comment_id", "parent_comment_id"])
      .toString();

    //更新跟评论的回复数量
    const updateRootCount = post_comment
      .update({ is_root_reply_count: "is_root_reply_count + 1" })
      .where(`id=tb.root_comment_id`)
      .toString();

    const sql = `
      WITH postUpdated AS (${updateCommentCount}),
      WITH tb AS (${insertRes}),
      WITH r AS (${updateRootCount})
      SELECT tb.id, tb.root_comment_id, tb.parent_comment_id FROM tb;`;

    //更新父级评论的回复数量
    const updateParentCount = post_comment
      .update({ reply_count: "reply_count + 1" })
      .where(`id=${v(reply_comment_id)}`)
      .toString();

    const [r1] = await dbPool.multipleQueryRows([sql, updateParentCount].join(";\n"));

    return r1[0].id;
  } else {
    const insertText = `WITH tb as (${updateCommentCount})
    INSERT INTO ${post_comment.name}
    (content_text,post_id,user_id)  
    SELECT ${v(param.text)}, ${v(postId)}, ${v(userId)} FROM tb
    RETURNING id, root_comment_id, parent_comment_id`;

    const res = await dbPool.queryRows<{ id: number }>(insertText);
    if (res.length === 0) throw new HttpError(404, `id 为 ${postId} 的帖子不存在`);
    return res[0].id;
  }
}
