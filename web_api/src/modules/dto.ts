export * from "./passport/passport.dto.ts";

export * from "./user/user.dto.ts";
export * from "./class/class.dto.ts";
export * from "./captcha/captcha.dto.ts";
export * from "./dto_common.ts";
export * from "./post/platform_post.dto.ts";
export * from "./post/post.dto.ts";
export * from "./live/live.dto.ts";

export type { TextStructureType, TextStructure } from "@ijia/data/db";
export enum Platform {
  /** 抖音 */
  douYin = "douyin",
  /** bilibili */
  bilibili = "bilibili",
  /** 小红书 */
  xiaoHongShu = "xiaohonshu",
  /** 微博 */
  weibo = "weibo",
  /** 5Sing 音乐 */
  v5sing = "v5sing",
  /** 网易云音乐 */
  wangYiMusic = "wangyiyun",
}
