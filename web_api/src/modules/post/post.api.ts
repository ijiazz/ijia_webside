import { GetPostListParam, LivePostResponse } from "./post.dto.ts";

export interface AssetApi {
  /** 获取公共班级列表 */
  "GET /live/posts": {
    response: LivePostResponse;
    query?: GetPostListParam;
  };
}
