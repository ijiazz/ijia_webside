import { GetListOption } from "../dto_common.ts";
import { ScreenAvatarRes, HomePageRes, GetBulletChatListRes, GetBulletChatParam } from "./live.dto.ts";

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
