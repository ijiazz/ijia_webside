export * from "./post_comment/dto.ts";

import type {
  CreatePostCommentParam,
  CreatePostCommentResponse,
  GetPostCommentListParam,
  PostCommentResponse,
} from "./post_comment/dto.ts";

export interface PostCommentApi {
  /** 发布评论  */
  "PUT /post/comment/entity": {
    body: CreatePostCommentParam;
    response: CreatePostCommentResponse;
  };

  /** 获取评论列表 */
  "GET /post/comment/list": {
    response: PostCommentResponse;
    query: GetPostCommentListParam;
  };

  /** 删除帖子评论 */
  "DELETE /post/comment/entity/:commentId": {
    params: { commentId: number | string };
  };

  /** 点赞帖子评论 */
  "POST /post/comment/entity/:commentId/like": {
    params: { commentId: number | string };
    query?: {
      isCancel?: boolean;
    };
    response: {
      success: boolean;
    };
  };
  /** 举报帖子评论 */
  "POST /post/comment/entity/:commentId/report": {
    params: { commentId: number | string };
    body?: {
      reason?: string;
    };
    response: {
      success: boolean;
    };
  };
}
