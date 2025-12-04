import { TextStructure } from "@ijia/data/db";

export type Option<T> = {
  label: string;
  value: T;
};
export type ListDto<T> = {
  items: T[];
  total: number;
};

export type InfiniteListDto<T> = {
  items: T[];
  has_more: boolean;
};

export type CursorListDto<T, C> = InfiniteListDto<T> & {
  before_cursor?: C | null;
  next_cursor?: C | null;
};

export interface GetListOption {
  number?: number;
  offset?: number;
}

export type TextStructureExternalLink = TextStructure & {
  link: string;
};

export type { TextStructure } from "@ijia/data/db";

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
  qqMusic = "qqmusic",
}
export enum TextStructureType {
  unknown = -1,
  /** 外部链接 */
  link = 0,
  /** 平台用户 */
  user = 1,
  /** 话题 */
  topic = 2,
}
