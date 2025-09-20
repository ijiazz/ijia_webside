import { Platform } from "@ijia/data/db";
import { ListDto } from "../dto_common.ts";
import { PostItemBase, PostUserInfo } from "./post.dto.ts";

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

export interface PlatformPostItemDto extends PostItemBase {
  /** 作者信息 */
  author: PostUserInfo;
  post_id: string;
  platform: Platform;
  url?: string;
}
export * from "./common.dto.ts";
