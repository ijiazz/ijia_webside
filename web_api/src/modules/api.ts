export * from "./passport/passport.dto.ts";

export * from "./user/user.dto.ts";
export * from "./class/class.dto.ts";
export * from "./captcha/captcha.dto.ts";
export * from "./dto_common.ts";
export * from "./post/platform_post.dto.ts";
export * from "./post/post.dto.ts";
export * from "../routers/post/comment/_dto.ts";
export * from "./post/PostReview.dto.ts";
export * from "./live/live.dto.ts";

import { CaptchaApi } from "./captcha/captcha.api.ts";
import { ClassApi } from "./class/class.api.ts";
import { PassportApi } from "./passport/passport.api.ts";
import { UserApi } from "./user/user.api.ts";
import { PostModuleAPI } from "./post/mod.api.ts";
import { LiveApi } from "./live/live.api.ts";
export interface ApiDefined extends PassportApi, CaptchaApi, ClassApi, UserApi, PostModuleAPI, LiveApi {}
