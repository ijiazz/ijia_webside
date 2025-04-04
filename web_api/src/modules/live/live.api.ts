import { GetListOption } from "../dto_common.ts";
import { ScreenAvatarRes, HomePageRes } from "./live.dto.ts";
import { CommentStatByCount } from "./stat/stat.dto.ts";

export interface LiveApi {
  "GET /live/screen/avatar": {
    response: ScreenAvatarRes;
    query?: GetListOption;
  };
  "GET /live/screen/home": {
    response: HomePageRes;
  };
}

export interface LiveApi {
  /** 获取根评论数量排行榜 */
  "GET /live/stat/count_by_user": {
    response: CommentStatByCount[];
    query: { page?: number; pageSize?: number };
  };
}
