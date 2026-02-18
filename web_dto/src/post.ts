export * from "./post/_dto/mod.ts";

import type { GetPlatformPostListParam, PlatformPostResponse } from "./post/_dto/platform_post.dto.ts";
import type {
  CreatePostParam,
  GetPostListParam,
  PostResponse,
  UpdatePostConfigParam,
  UpdatePostContentParam,
  PostGroupResponse,
  PostUserResponse,
} from "./post/_dto/mod.ts";
import type { PostCommentApi } from "./post_comment.ts";

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
  /** 获取公开作品列表 */
  "GET /post/list": {
    response: PostResponse;
    query?: GetPostListParam;
  };
  /** 获取自己的作品列表 */
  "GET /post/user": {
    response: PostUserResponse;
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
