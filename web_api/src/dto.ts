import { CaptchaApi } from "./dto/captcha.ts";
import { PassportApi } from "./dto/passport.ts";
import { UserApi } from "./dto/user.ts";
import { ClassApi } from "./dto/class.ts";
import { LiveApi } from "./dto/live.ts";
import { PostApi } from "./dto/post.ts";

export interface ApiDefined extends PostApi, ClassApi, LiveApi, UserApi, PassportApi, CaptchaApi {}

export * from "./dto/common.ts";
export * from "./dto/media.ts";
export * from "./dto/post.ts";
export * from "./dto/post_comment.ts";
export * from "./dto/class.ts";
export * from "./dto/live.ts";
export * from "./dto/user.ts";
export * from "./dto/passport.ts";
export * from "./dto/captcha.ts";
