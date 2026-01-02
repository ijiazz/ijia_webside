import { GetListOption } from "./common.ts";
import { GetBulletChatListRes, GetBulletChatParam, HomePageRes, ScreenAvatarRes } from "./live/dto.ts";

export * from "./live/dto.ts";

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
