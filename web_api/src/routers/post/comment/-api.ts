import {
  CreatePostCommentParam,
  GetPostCommentListParam,
  PostCommentResponse,
  CreatePostCommentResponse,
} from "./_dto.ts";
export * from "./_dto.ts";

export interface PostCommentApi {
  /** 发布评论 */
  "PUT /post/content/:postId/comment": {
    params: { postId: number | string };
    body: CreatePostCommentParam;
    response: CreatePostCommentResponse;
  };
  /** 获取指定作品的评论列表 */
  "GET /post/content/:postId/comment": {
    response: PostCommentResponse;
    params: { postId: number | string };
    query?: GetPostCommentListParam;
  };
  /** 获取指定评论的回复列表 */
  "GET /post/comment/entity/:commentId/root_list": {
    response: PostCommentResponse;
    query?: GetPostCommentListParam;
    params: { commentId: number | string };
  };
  /** 删除帖子评论 */
  "DELETE /post/comment/entity/:commentId": {
    params: { commentId: number | string };
  };

  /** 点赞帖子评论 */
  "POST /post/comment/like/:commentId": {
    params: { commentId: number | string };
    query?: {
      isCancel?: boolean;
    };
    response: {
      success: boolean;
    };
  };
  /** 举报帖子评论 */
  "POST /post/comment/report/:commentId": {
    params: { commentId: number | string };
    body?: {
      reason?: string;
    };
    response: {
      success: boolean;
    };
  };
}
