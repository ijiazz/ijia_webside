import { GetPlatformPostListParam, PlatformPostResponse } from "./platform_post.dto.ts";
import { CreatePostParam, GetPostListParam, PostGroupResponse, PostResponse, UpdatePostParam } from "./post.dto.ts";

export interface PostApi {
  /** 获取平台帖子列表 */
  "GET /post/god_list": {
    response: PlatformPostResponse;
    query?: GetPlatformPostListParam;
  };
}
export interface PostApi {
  /** 获取作品分组 */
  "GET /post/group": {
    response: PostGroupResponse;
  };
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
    body: UpdatePostParam;
  };
  /** 点赞作品 */
  "POST /post/like/:postId": {
    query?: {
      isCancel?: boolean;
    };
  };
  /** 举报作品 */
  "POST /post/report/:postId": {
    body?: {
      reason?: string;
    };
  };
}
export interface ReviewPostApi {
  /** 获取审核摘要 */
  "GET /review/stat": {};
  /** 获取下一个审核项 */
  "GET /review/post/content": {};
  /** 审核作品 */
  "POST /review/post/content": {};
}
