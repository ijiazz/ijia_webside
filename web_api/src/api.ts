import { PostApi } from "./routers/post/-api.ts";

export interface ApiDefined extends PostApi {}

export * from "./dto/dto_common.ts";
export * from "./routers/post/-api.ts";
export * from "./routers/post/comment/-api.ts";

/** -- 废弃 -- */
export interface ApiDefined extends PassportApi, CaptchaApi, ClassApi, UserApi, LiveApi {}

import { CaptchaApi } from "./modules/captcha/captcha.api.ts";
import { ClassApi } from "./modules/class/class.api.ts";
import { LiveApi } from "./modules/live/live.api.ts";
import { PassportApi } from "./modules/passport/passport.api.ts";
import { UserApi } from "./modules/user/user.api.ts";

export * from "./modules/passport/passport.dto.ts";

export * from "./modules/user/user.dto.ts";
export * from "./modules/class/class.dto.ts";
export * from "./modules/captcha/captcha.dto.ts";
export * from "./modules/live/live.dto.ts";
/** -- 废弃 -- */
