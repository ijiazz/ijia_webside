import { type ListDto, Platform } from "../../common.ts";
import type { PostBase, PostUserInfo } from "./common.ts";

export type PlatformPostResponse = ListDto<PlatformPostItemDto> & { needLogin?: boolean };

export type GetPlatformPostListParam = {
  /** @deprecated 考虑使用 cursor */
  offset?: number;
  number?: number;
  /** timestamp-id */
  cursor?: string;

  post_id?: number;
  s_content?: string;
  s_author?: string;

  // sort?: Record<"digg_total" | "forward_total" | "collection_num", "ASC" | "DESC">;
  platform?: Platform;
};

export interface PlatformPostItemDto extends PostBase {
  /** 作者信息 */
  create_time?: string | null;
  author: PostUserInfo;
  post_id: string;
  platform: Platform;
  url?: string;
}
