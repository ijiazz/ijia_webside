import type { CaptchaApi } from "./captcha.ts";
import type { PassportApi } from "./passport.ts";
import type { UserApi } from "./user.ts";
import type { ClassApi } from "./class.ts";
import type { LiveApi } from "./live.ts";
import type { PostApi } from "./post.ts";
import type { ReviewApi } from "./review.ts";

export interface ApiDefined extends PostApi, ClassApi, LiveApi, UserApi, PassportApi, CaptchaApi, ReviewApi {}

export * from "./common.ts";
export * from "./post.ts";
export * from "./post_comment.ts";
export * from "./class.ts";
export * from "./live.ts";
export * from "./user.ts";
export * from "./passport.ts";
export * from "./captcha.ts";
export * from "./review.ts";
