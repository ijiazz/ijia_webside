import { GetPostListParam, LivePostResponse } from "./app.dto.ts";

export interface AssetApi {
  /** 获取公共班级列表 */
  "GET /post/god_list": {
    response: LivePostResponse;
    query?: GetPostListParam;
  };
}
