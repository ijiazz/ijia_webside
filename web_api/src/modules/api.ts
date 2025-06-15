import { CaptchaApi } from "./captcha/captcha.api.ts";
import { ClassApi } from "./class/class.api.ts";
import { PassportApi } from "./passport/passport.api.ts";
import { UserApi } from "./user/user.api.ts";
import { PostModuleAPI } from "./post/mod.api.ts";
import { LiveApi } from "./live/live.api.ts";
export interface ApiDefined extends PassportApi, CaptchaApi, ClassApi, UserApi, PostModuleAPI, LiveApi {}
