import { GetListOption } from "./common.ts";
import { GetBulletChatListRes, GetBulletChatParam, HomePageRes, ScreenAvatarRes } from "./live/dto.ts";
import { CommentStatByCount } from "./live/stat.ts";

export * from "./live/dto.ts";
export * from "./live/stat.ts";

export interface LiveApi {
  "GET /live/screen/avatar": {
    response: ScreenAvatarRes;
    query?: GetListOption;
  };
  "GET /live/screen/home": {
    response: HomePageRes;
  };

  "GET /live/screen/bullet-chart": {
    response: GetBulletChatListRes;
    query?: GetBulletChatParam;
  };
}

export interface LiveApi {
  /** 获取根评论数量排行榜 */
  "GET /live/stat/count_by_user": {
    response: CommentStatByCount[];
    query: { page?: number; pageSize?: number };
  };
}
