import { GetPlatformPostListParam, PlatformPostResponse } from "./_dto/platform_post.dto.ts";
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
} from "./_dto/mod.ts";
import { GetPostCommentListParam } from "./comment/_dto.ts";
import { PostCommentApi } from "./comment/-api.ts";

export * from "./_dto/mod.ts";

export interface PostApi {
  /** 获取平台帖子列表 */
  "GET /post/god_list": {
    response: PlatformPostResponse;
    query?: GetPlatformPostListParam;
  };
}

export interface PostApi {
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
  "PUT /post/content": {
    body: CreatePostParam;
    response: {
      id: number;
    };
  };
  /** 删除作品 */
  "DELETE /post/content/:postId": {};
  /** 更新作品 */
  "PATCH /post/content/:postId": {
    body: UpdatePostContentParam | UpdatePostConfigParam;
  };
  /** 点赞作品 */
  "POST /post/like/:postId": {
    query?: {
      isCancel?: boolean;
    };
    response: {
      success: boolean;
    };
  };
  /** 举报作品 */
  "POST /post/report/:postId": {
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

export interface PostApi extends PostCommentApi {}
