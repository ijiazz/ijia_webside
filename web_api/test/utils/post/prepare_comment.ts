import { DbComment } from "@ijia/school-db/db";
import { Api, JWT_TOKEN_KEY } from "#test/fixtures/hono.ts";
import type { GetCommentListOption } from "@ijia/api-types";
import { preparePost } from "./prepare_post.ts";
import { select } from "@asla/yoursql";
import { v } from "@/sql/utils.ts";
import { dbPool } from "@/db/client.ts";

export class PostComment {
  constructor(
    readonly api: Api,
    commentTreeId: string | number,
  ) {
    this.commentTreeId = commentTreeId.toString();
  }
  readonly commentTreeId: string;
  async createComment(
    text: string,
    option: {
      replyCommentId?: number | string;
      token?: string;
    } = {},
  ) {
    const result = await this.api["/comment"].put({
      body: { text, comment_tree_id: this.commentTreeId, comment_reply_id: option.replyCommentId?.toString() },
      [JWT_TOKEN_KEY]: option.token,
    });
    return { id: Number(result.comment_id) };
  }
  async getComment(commentId: string | number, token?: string) {
    return this.api["/get-comment/list"].get({
      query: { commentId: commentId.toString() },
      [JWT_TOKEN_KEY]: token,
    });
  }
  async getCommentList(option?: GetCommentListOption, token?: string) {
    return this.api["/get-comment/list"].get({
      query: { ...option, commentTreeId: this.commentTreeId },
      [JWT_TOKEN_KEY]: token,
    });
  }
  async getReplyList(commentId: string | number, option?: GetCommentListOption, token?: string) {
    return this.api["/get-comment/list"].get({
      query: { ...option, parentCommentId: commentId.toString() },
      [JWT_TOKEN_KEY]: token,
    });
  }
  async deleteComment(commentId: string | number, option: { token?: string } = {}) {
    return this.api["/comment/:commentId"].delete({
      params: { commentId: commentId.toString() },
      [JWT_TOKEN_KEY]: option.token,
    });
  }
}

export async function setCommentLike(api: Api, commentId: string | number, token?: string) {
  return api["/comment/:commentId/like"].post({
    params: { commentId: commentId.toString() },
    [JWT_TOKEN_KEY]: token,
  });
}
export async function cancelCommentLike(api: Api, commentId: string | number, token?: string) {
  return api["/comment/:commentId/like"].post({
    params: { commentId: commentId.toString() },
    query: { isCancel: true },
    [JWT_TOKEN_KEY]: token,
  });
}
export async function reportComment(api: Api, commentId: string | number, reason?: string, token?: string) {
  return api["/comment/:commentId/report"].post({
    params: { commentId: commentId.toString() },
    body: { reason },
    [JWT_TOKEN_KEY]: token,
  });
}

/** 直接从数据库查询评论的数据 */
export async function getCommentDbRow(commentId: number) {
  return dbPool.queryFirstRow(select("*").from("comment").where(`id=${commentId}`).limit(1));
}
export async function prepareCommentPost(api: Api) {
  const { alice, post } = await preparePost(api, undefined);
  const info = await dbPool.queryFirstRow<{ comment_tree_id: number }>(
    v.gen`SELECT comment_tree_id FROM post WHERE id=${post.id}`,
  );
  const action = new PostComment(api, info.comment_tree_id);
  return { alice, post: { ...post, ...info }, action };
}
export async function getCommentTotal(commentTreeId: number) {
  return dbPool
    .queryFirstRow(
      select("comment_total")
        .from("comment_tree")
        .where(`id=${v(commentTreeId)}`),
    )
    .then((r) => r.comment_total);
}

export type CommentInfo = Pick<DbComment, "like_count" | "dislike_count">;
export async function getCommentStat(commentId: number): Promise<CommentInfo> {
  return dbPool.queryFirstRow(
    select<CommentInfo>({ like_count: true, dislike_count: true })
      .from("comment")
      .where(`id=${v(commentId)}`),
  );
}
