import { GetPlatformPostListParam, PlatformPostResponse } from "./platform_post.dto.ts";

export interface AssetApi {
  /** 获取平台帖子列表 */
  "GET /post/god_list": {
    response: PlatformPostResponse;
    query?: GetPlatformPostListParam;
  };
}
export interface PostApi {
  /** 获取作品分组 */
  "GET /post/group": {};
  /** 获取作品列表 */
  "GET /post": {};
  /** 创建作品 */
  "PUT /post/content": {};
  /** 获取作品详情 */
  "GET /post/content/:id": {};
  /** 删除作品 */
  "DELETE /post/content/:id": {};
  /** 更新作品 */
  "PATCH /post/content/:id": {};
  /** 点赞作品 */
  "POST /post/digg/:id": {};
}
export interface ReviewPostApi {
  /** 获取审核摘要 */
  "GET /review/stat": {};
  /** 获取下一个审核项 */
  "GET /review/post/content": {};
  /** 审核作品 */
  "POST /review/post/content": {};
}
