import { post, post_comment, user, post_comment_like } from "@ijia/data/db";
import v, { dbPool, Selection } from "@ijia/data/yoursql";
import {
  CreateCommentData,
  CreateCommentItemData,
  GetPostCommentListParam,
  PostCommentDto,
  PostCommentResponse,
} from "../comment.dto.ts";
import { HttpError } from "@/global/errors.ts";
import { jsonb_build_object } from "@/global/sql_util.ts";
import { parserTimestampCursor, toTimestampCursor } from "./_util.ts";

export async function createComment(
  postId: number,
  userId: number,
  paramList: CreateCommentItemData[],
): Promise<CreateCommentData[]> {
  const data = v.createValues(
    "data",
    paramList.map((item) => ({ content_text: item.text, parent_comment_id: item.replyCommentId })),
    { content_text: "TEXT", parent_comment_id: "INT" },
  );

  const commentTable = post_comment.name;

  const insertRaw = Selection.from(data.toSelect())
    .innerJoin(post, "p", [
      // 只有符合条件的帖子才可以添加评论
      `p.id=${v(postId)}`,
      `NOT p.is_delete`, // 帖子未被删除
      `(p.is_review_pass OR p.is_review_pass IS NULL)`, // 审核通过的或未审核的 帖子
      `NOT p.is_reviewing`, // 帖子未在审核中
      `NOT p.is_hide`, // 帖子未设置仅作者可见
    ])
    .leftJoin(post_comment, "parent", `parent.id=data.parent_comment_id`)
    .select([
      "data.content_text",
      `p.id AS post_id`,
      `${v(userId)} AS user_id`,
      `parent.id AS parent_comment_id`,
      `(CASE WHEN parent.root_comment_id IS NULL THEN parent.id ELSE parent.root_comment_id END) AS root_comment_id`,
    ])
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
      UPDATE ${post.name} SET
        comment_num = comment_num + post_count.count
      FROM (
         SELECT post_id, count(*) as count FROM inserted GROUP BY post_id
      ) AS post_count
      WHERE ${post.name}.id = post_count.post_id
      RETURNING ${post.name}.id
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
    throw new HttpError(404, "无法创建评论，可能是帖子不存在或已被删除");
  }
  return res;
}

export async function getCommentList(
  target: { postId: number; rootCommentId?: undefined } | { postId?: undefined; rootCommentId: number },
  param: GetPostCommentListParam & { userId?: number | null },
): Promise<PostCommentResponse> {
  const { number = 20, cursor: cursorStr, forward, commentId } = param;
  let currentUserId = param.userId;
  if (typeof currentUserId !== "number") currentUserId = null;
  const cursor = cursorStr ? parserTimestampCursor(cursorStr) : null;

  let curr_user: string | undefined;
  if (currentUserId !== null) {
    curr_user = jsonb_build_object({
      can_update: `u.id=${v(currentUserId)} OR p.user_id=${v(currentUserId)}`,

      /** like_weight 用量计算 is_like 和 is_report */
      like_weight: `${post_comment_like
        .select("weight")
        .where(["comment_id=c.id", `user_id=${v(currentUserId)}`])
        .toSelect()}`,
    });
  } else {
    curr_user = "null";
  }
  const isRootReply = typeof target.rootCommentId === "number";

  const raw = await post_comment
    .fromAs("c")
    .innerJoin(user, "u", "c.user_id=u.id")
    .innerJoin(post, "p", ["c.post_id=p.id", "NOT p.is_delete"])
    .leftJoin(post_comment, "reply", "c.parent_comment_id=reply.id")
    .select([
      "c.id as comment_id",
      "c.root_comment_id",
      "c.is_root_reply_count",
      "c.reply_count",
      "EXTRACT(epoch FROM c.create_time) AS create_time",
      "c.content_text",
      "c.content_text_struct",
      "c.like_count",
      `${jsonb_build_object({
        user_id: "u.id",
        user_name: "u.nickname",
        avatar_url: "'/file/avatar/'||u.avatar",
      })} AS user`,
      `${curr_user} as curr_user`,
      `(CASE WHEN c.parent_comment_id IS NULL THEN NULL 
        ELSE
      ${jsonb_build_object({
        user: user
          .select(`${jsonb_build_object({ user_id: "id", user_name: "nickname" })} `)
          .where("reply.user_id=id")
          .toSelect(),
        comment_id: "c.parent_comment_id",
        is_deleted: "reply.is_delete",
      })}
        END) AS reply_to`,
    ])
    .where(() => {
      const where = [`NOT c.is_delete`];

      where.push(
        `(p.user_id = ${v(currentUserId)} OR (${[
          "NOT p.is_reviewing",
          "NOT p.is_hide",
          "(p.is_review_pass OR p.is_review_pass IS NULL)",
        ].join(" AND ")}))`,
      );

      if (isRootReply) {
        where.push(`c.root_comment_id =${v(target.rootCommentId)}`);
      } else {
        where.push(`c.post_id=${v(target.postId)}`, `c.root_comment_id IS NULL`);
      }
      if (typeof commentId === "number") {
        where.push(`c.id=${v(commentId)}`);
      } else if (cursor) {
        const timestamp = cursor.timestamp;
        if (forward) {
          where.push(
            `(c.create_time < to_timestamp(${timestamp}) OR (c.create_time = to_timestamp(${timestamp}) AND c.id < ${v(cursor.id)}))`,
          );
        } else {
          where.push(
            `(c.create_time > to_timestamp(${timestamp}) OR (c.create_time = to_timestamp(${timestamp}) AND c.id > ${v(cursor.id)}))`,
          );
        }
      }
      return where;
    })
    .orderBy(["c.create_time ASC", "c.id ASC"])
    .limit(number)
    .queryRows();

  raw.forEach((item) => {
    const currUser = item.curr_user;
    if (currUser) {
      const weight = currUser.like_weight;
      delete currUser.like_weight; // 删除不需要的字段
      const postItem = currUser as NonNullable<PostCommentDto["curr_user"]>;
      if (weight) {
        postItem.is_like = weight > 0; // 是否点赞
        postItem.is_report = weight < 0; // 是否举报
      }
    }
  });
  const list = raw as PostCommentDto[];
  const first = list[0];
  const lastItem = list[list.length - 1];
  return {
    has_more: list.length >= number,
    before_cursor: first ? toTimestampCursor({ timestamp: first.create_time, id: first.comment_id }) : undefined,
    next_cursor: lastItem ? toTimestampCursor({ timestamp: lastItem.create_time, id: lastItem.comment_id }) : undefined,
    items: list,
  };
}

/** 获取指定用户是否能发布评论 */
export async function getUserCanCreateCommentLimit(userId: number, second: number = 2) {
  if (typeof second !== "number" || second <= 0) {
    throw new Error("second 必须是大于0的数字");
  }
  const list = await post_comment
    .select({ create_time: true, id: true })
    .where([`user_id=${v(userId)}`, `now() - create_time < interval ' ${second} second'`])
    .limit(1)
    .queryRows();

  return list.length === 0;
}

export async function recursiveDeleteComment(commentId: number, userId: number) {
  const ctName = post_comment.name;
  //删除 commentId 以及所有子评论，更新父级评论回复数和跟评论回复总数

  const deleteComment = `
WITH 
  need_delete AS (
    ${post_comment
      .fromAs("base")
      .innerJoin(post, "p", ["base.post_id=p.id"])
      .select([
        "base.id AS cid",
        "base.parent_comment_id AS parent_cid",
        "base.root_comment_id as root_cid",
        "base.user_id AS comment_user_id",
        "p.id as post_id",
        "p.user_id AS post_user_id",
      ])
      .where([`base.id=${v(commentId)}`, "NOT base.is_delete", `(p.user_id=${v(userId)} OR base.user_id=${v(userId)})`])
      .toString()}
  ), deleted AS (
  UPDATE ${ctName} SET 
    is_delete= TRUE,
    is_root_reply_count= 0,
    reply_count= 0
  FROM (
    WITH RECURSIVE tree AS (
      SELECT cid AS cid FROM need_delete
      UNION ALL
      ${post_comment.fromAs("c").innerJoin("tree", undefined, ["c.parent_comment_id=tree.cid", "NOT c.is_delete"]).select("c.id").toString()}
    )
    SELECT * FROM tree
  ) as tree2 
  WHERE NOT is_delete AND ${ctName}.id= tree2.cid
  RETURNING id, root_comment_id, parent_comment_id
), delete_total AS (
  SELECT COUNT(*) FROM deleted
), update_post AS (
    ${post.update({ comment_num: "comment_num - delete_total.count" }).toString()}
  FROM delete_total, need_delete
  WHERE ${post.name}.id = need_delete.post_id
), change_parent AS (${createChangeParent("deleted")}), update_parent AS (  
  UPDATE ${ctName} SET 
    reply_count = ${ctName}.reply_count - change_parent.reply_count,
    is_root_reply_count = ${ctName}.is_root_reply_count - change_parent.is_root_reply_count
  FROM change_parent WHERE ${ctName}.id = change_parent.id
)
SELECT 
  (SELECT json_agg(change_parent) FROM change_parent) AS change_parent,
  (SELECT count(need_delete)::INT FROM need_delete) AS can_delete_total, 
  delete_total.count::INT AS deleted_total
FROM delete_total
`;
  const result = await dbPool.queryRows<{
    deleted_total: number;
    can_delete_total: number;
    need_delete: { post_user_id: number; comment_user_id: number }[];
  }>(deleteComment);
  const deleteInfo = result[0];
  if (!deleteInfo.can_delete_total) throw new HttpError(404, `id 为 ${commentId} 的评论不存在`);
}
/**
 *
 * 用户可以删除自己的评论。
 * 帖子作者可以删除所有评论
 */
export async function deleteComment(commentId: number, userId: number) {
  const ctName = post_comment.name;
  const sqlText = `WITH deleted AS (
    UPDATE ${ctName} SET is_delete= TRUE
    FROM ${post.name} AS p
    WHERE ${ctName}.id=${v(commentId)} AND NOT ${ctName}.is_delete AND (p.user_id=${v(userId)} OR ${ctName}.user_id=${v(userId)})
    RETURNING ${ctName}.id, ${ctName}.root_comment_id, ${ctName}.parent_comment_id, ${ctName}.post_id, ${ctName}.is_root_reply_count
  ), update_post AS (
    UPDATE ${post.name} AS p
    SET comment_num = comment_num - (
      CASE WHEN deleted.root_comment_id IS NULL
      THEN deleted.is_root_reply_count +1
      ELSE 1 END
    ) FROM deleted
    WHERE p.id = deleted.post_id
  ), change_parent AS (${createChangeParent("deleted")}), update_parent AS (  
    UPDATE ${ctName} SET 
      reply_count = ${ctName}.reply_count - change_parent.reply_count,
      is_root_reply_count = ${ctName}.is_root_reply_count - change_parent.is_root_reply_count
    FROM change_parent
    WHERE ${ctName}.id = change_parent.id
  )
  SELECT count(deleted.id)::INT AS deleted_total FROM deleted
  `;
  const result = await dbPool.queryRows<{ deleted_total: number }>(sqlText);

  const deleteInfo = result[0];
  if (!deleteInfo.deleted_total) throw new HttpError(404, `id 为 ${commentId} 的评论不存在`);
}
/**
 *
 * inputTable: parent_comment_id, root_comment_id
 * outputTable: id, reply_count, is_root_reply_count
 */
function createChangeParent(targetTableName: string) {
  return `
  SELECT COALESCE(a.id, b.id) AS id, 
    COALESCE(a.parent_count, 0) AS reply_count,
    COALESCE(b.root_count, 0) AS is_root_reply_count
  FROM (
    SELECT parent_comment_id AS id, COUNT(*) AS parent_count 
    FROM ${targetTableName}
    WHERE parent_comment_id IS NOT NULL
    GROUP BY parent_comment_id
  ) AS a FULL OUTER JOIN (
    SELECT root_comment_id AS id, COUNT(*) AS root_count 
    FROM ${targetTableName} 
    WHERE root_comment_id IS NOT NULL
    GROUP BY root_comment_id
  ) AS b ON a.id = b.id
`;
}
