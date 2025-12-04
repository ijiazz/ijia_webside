export * from "./post_comment/dto.ts";

import {
  CreatePostCommentParam,
  CreatePostCommentResponse,
  GetPostCommentListParam,
  PostCommentDto,
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
    params: { postId: number | string };
    query?: GetPostCommentListParam;
  };

  /** 获取指定评论信息 */
  "GET /post/comment/entity/:commentId": {
    response: { item: PostCommentDto };
    params: { commentId: number | string };
  };

  /**
   * 获取指定作品的评论列表
   * @deprecated
   */
  "GET /post/content/:postId/comment": {
    response: PostCommentResponse;
    params: { postId: number | string };
    query?: GetPostCommentListParam;
  };
  /**
   * 获取指定评论的回复列表
   *  @deprecated
   */
  "GET /post/comment/entity/:commentId/root_list": {
    response: PostCommentResponse;
    query?: Omit<GetPostCommentListParam, "parentCommentId">;
    params: { commentId: number | string };
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
