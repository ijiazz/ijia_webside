export * from "./post/_dto/mod.ts";

import { GetPlatformPostListParam, PlatformPostResponse } from "./post/_dto/platform_post.dto.ts";
import {
  CommitReviewParam,
  CommitReviewResultDto,
  CreatePostParam,
  GetPostListParam,
  PostResponse,
  PostReviewItemDto,
  UpdatePostConfigParam,
  UpdatePostContentParam,
  PostGroupResponse,
} from "./post/_dto/mod.ts";
import { GetPostCommentListParam, PostCommentApi } from "./post_comment.ts";

export interface PostApi extends PostCommentApi {}

export interface PostApi {
  /** 获取平台帖子列表 */
  "GET /post/god_list": {
    response: PlatformPostResponse;
    query?: GetPlatformPostListParam;
  };
  /** 获取作品分组 */
  "GET /post/group/list": {
    response: PostGroupResponse;
  };
}

export interface PostApi {
  /** 获取作品列表 */
  "GET /post/list": {
    response: PostResponse;
    query?: GetPostListParam;
  };
  /** 创建作品 */
  "PUT /post/entity": {
    body: CreatePostParam;
    response: {
      id: number;
    };
  };
  /** 删除作品 */
  "DELETE /post/entity/:postId": {};
  /** 更新作品 */
  "PATCH /post/entity/:postId": {
    body: UpdatePostContentParam | UpdatePostConfigParam;
  };
  /** 点赞作品 */
  "POST /post/entity/:postId/like": {
    query?: {
      isCancel?: boolean;
    };
    response: {
      success: boolean;
    };
  };
  /** 举报作品 */
  "POST /post/entity/:postId/report": {
    params?: {
      postId: number;
    };
    body?: {
      reason?: string;
    };
    response: {
      success: boolean;
    };
  };
}
export interface PostApi {
  /** 获取帖子审核列表 */
  "GET /post/review/next": {
    response: PostReviewItemDto;
    query?: GetPostCommentListParam;
  };
  /** 获取帖子审核列表 */
  "POST /post/review/entity/:reviewId/commit": {
    response: CommitReviewResultDto;
    params: { reviewId: string | number };
    body: CommitReviewParam;
  };
}
