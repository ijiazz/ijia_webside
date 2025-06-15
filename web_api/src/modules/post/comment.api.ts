import { CreatePostCommentParam, GetPostCommentListParam, PostCommentResponse } from "./comment.dto.ts";

export interface PostCommentApi {
  /** 发布评论 */
  "PUT /post/content/:postId/comment": {
    body: CreatePostCommentParam;
    response: {
      id: number;
    };
  };
  /** 获取指定作品的评论列表 */
  "GET /post/content/:postId/comment": {
    response: PostCommentResponse;
    query?: GetPostCommentListParam;
  };
  /** 获取指定评论的回复列表 */
  "GET /post/comment/entity/:commentId/reply_list": {
    response: PostCommentResponse;
    query?: GetPostCommentListParam;
  };
  /** 删除帖子评论 */
  "DELETE /post/comment/entity/:commentId": {};

  /** 点赞帖子评论 */
  "POST /post/comment/like/:commentId": {
    query?: {
      isCancel?: boolean;
    };
    response: {
      success: boolean;
    };
  };
  /** 举报帖子评论 */
  "PUT /post/comment/report/:postId": {
    body?: {
      reason?: string;
    };
    response: {
      success: boolean;
    };
  };
}
