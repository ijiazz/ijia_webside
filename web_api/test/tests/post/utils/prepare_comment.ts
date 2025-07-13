import { CreateCommentItemData, GetPostCommentListParam } from "@/modules/post/comment.dto.ts";
import { post, post_comment } from "@ijia/data/db";
import { Api, JWT_TOKEN_KEY } from "test/fixtures/hono.ts";
import { preparePost } from "./prepare_post.ts";
import v from "@ijia/data/yoursql";
import { createComment } from "@/modules/post/sql/post_comment.ts";

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
/** 直接从数据库查询评论的数据 */
export async function getCommentDbRow(commentId: number) {
  return post_comment.select("*").where(`id=${commentId}`).limit(1).queryFirstRow();
}
export async function prepareCommentPost(api: Api) {
  const post1 = await preparePost(api);
  const action = new PostComment(api, post1.post.id);
  return { ...post1, action };
}
export async function getPostCommentTotal(postId: number) {
  return post
    .select("comment_num")
    .where(`id=${v(postId)}`)
    .queryFirstRow()
    .then((r) => r.comment_num);
}

export async function prepareCommentToDb(postId: number, userId: number, comments: CreateCommentItemData[]) {
  return createComment(postId, userId, comments);
}
