import { GetListOption } from "../dto_common.ts";
import { ScreenAvatarRes, HomePageRes } from "./live.dto.ts";

export interface LiveApi {
  "GET /live/screen/avatar": {
    response: ScreenAvatarRes;
    query?: GetListOption;
  };
  "GET /live/screen/home": {
    response: HomePageRes;
  };
}
