import { CaptchaApi } from "./captcha/captcha.api.ts";
import { ClassApi } from "./class/class.api.ts";
import { PassportApi } from "./passport/passport.api.ts";
import { StatApi } from "./stat/stat.api.ts";
import { UserApi } from "./user/user.api.ts";

export interface ApiDefined extends PassportApi, CaptchaApi, ClassApi, UserApi, StatApi {}
