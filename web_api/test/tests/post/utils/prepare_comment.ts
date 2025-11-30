import { CreateCommentItemData, GetPostCommentListParam } from "@/routers/post/comment/mod.ts";
import {
  DbPostComment,
  post,
  post_comment,
  post_review_info,
  DbPostReviewInfoCreate,
  PostReviewType,
} from "@ijia/data/db";
import { Api, JWT_TOKEN_KEY } from "test/fixtures/hono.ts";
import { preparePost } from "./prepare_post.ts";
import { createComment } from "@/routers/post/comment/-sql/post_comment.sql.ts";
import { select } from "@asla/yoursql";
import { v } from "@/sql/utils.ts";
import { dbPool } from "@ijia/data/dbclient";

export class PostComment {
  constructor(
    readonly api: Api,
    readonly postId: number,
  ) {}
  async createComment(
    text: string,
    option: {
      replyCommentId?: number;
      token?: string;
    } = {},
  ) {
    return this.api["/post/content/:postId/comment"].put({
      params: { postId: this.postId },
      body: { text, replyCommentId: option.replyCommentId },
      [JWT_TOKEN_KEY]: option.token,
    });
  }
  async getCommentList(option?: GetPostCommentListParam, token?: string) {
    return this.api["/post/content/:postId/comment"].get({
      params: { postId: this.postId },
      query: option,
      [JWT_TOKEN_KEY]: token,
    });
  }
  async getReplyList(commentId: number, option?: GetPostCommentListParam, token?: string) {
    return this.api["/post/comment/entity/:commentId/root_list"].get({
      params: { commentId },
      query: option,
      [JWT_TOKEN_KEY]: token,
    });
  }
  async deleteComment(commentId: number, option: { token?: string } = {}) {
    return this.api["/post/comment/entity/:commentId"].delete({
      params: { commentId },
      [JWT_TOKEN_KEY]: option.token,
    });
  }
}

export async function setCommentLike(api: Api, commentId: number, token?: string) {
  return api["/post/comment/like/:commentId"].post({
    params: { commentId },
    [JWT_TOKEN_KEY]: token,
  });
}
export async function cancelCommentLike(api: Api, commentId: number, token?: string) {
  return api["/post/comment/like/:commentId"].post({
    params: { commentId },
    query: { isCancel: true },
    [JWT_TOKEN_KEY]: token,
  });
}
export async function reportComment(api: Api, commentId: number, reason?: string, token?: string) {
  return api["/post/comment/report/:commentId"].post({
    params: { commentId },
    body: { reason },
    [JWT_TOKEN_KEY]: token,
  });
}

/** 直接从数据库查询评论的数据 */
export async function getCommentDbRow(commentId: number) {
  return select("*").from(post_comment.name).where(`id=${commentId}`).limit(1).dataClient(dbPool).queryFirstRow();
}
export async function prepareCommentPost(api: Api) {
  const post1 = await preparePost(api, undefined);
  const action = new PostComment(api, post1.post.id);
  return { ...post1, action };
}
export async function getPostCommentTotal(postId: number) {
  return select("comment_num")
    .from(post.name)
    .where(`id=${v(postId)}`)
    .dataClient(dbPool)
    .queryFirstRow()
    .then((r) => r.comment_num);
}

export async function prepareCommentToDb(postId: number, userId: number, comments: CreateCommentItemData[]) {
  return createComment(postId, userId, comments);
}

export type CommentInfo = Pick<DbPostComment, "like_count" | "dislike_count">;
export async function getCommentStat(commentId: number): Promise<CommentInfo> {
  return select<CommentInfo>({ like_count: true, dislike_count: true })
    .from(post_comment.name)
    .where(`id=${v(commentId)}`)
    .dataClient(dbPool)
    .queryFirstRow();
}

export type CommentReviewStatus = Pick<DbPostReviewInfoCreate, "is_review_pass" | "reviewed_time" | "reviewer_id">;
export async function getCommentReviewStatus(commentId: number): Promise<CommentReviewStatus | undefined> {
  const t = await select({
    is_review_pass: true,
    reviewed_time: true,
    reviewer_id: true,
  })
    .from(post_review_info.name)
    .where([`type=${v(PostReviewType.postComment)}`, `target_id=${commentId}`])
    .dataClient(dbPool)
    .queryRows();

  return t[0] as CommentReviewStatus | undefined;
}
