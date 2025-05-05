import { Platform } from "@ijia/data/db";
import { ListDto } from "../dto_common.ts";
import { GetPostListParam, PostItemDto } from "./post.dto.ts";

export type PlatformPostResponse = ListDto<PlatformPostItemDto> & { needLogin?: boolean };

export type GetPlatformPostListParam = GetPostListParam & {
  platform?: Platform;
};

export interface PlatformPostItemDto extends PostItemDto {
  platform: Platform;
  url?: string;
}
export * from "./common.dto.ts";
