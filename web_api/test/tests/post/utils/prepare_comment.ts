import { Api, JWT_TOKEN_KEY } from "test/fixtures/hono.ts";

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
      body: { text, reply_comment_id: option.replyCommentId },
      [JWT_TOKEN_KEY]: option.token,
    });
  }
  async getCommentList() {}
  async getComment(commentId: number) {}
}
