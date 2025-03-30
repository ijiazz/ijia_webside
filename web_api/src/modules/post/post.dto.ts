import { Platform, TextStructure } from "@ijia/data/db";
import { GetListOption, ListDto } from "../dto_common.ts";
import { ImageAssetDto, AudioAssetDto, VideoAssetDto } from "./common.dto.ts";

export type LivePostResponse = ListDto<AssetItemDto> & { needLogin?: boolean };
export type GetPostListParam = GetListOption & {
  platform?: Platform;
  userId?: string;
  s_content?: string;
  s_author?: string;

  // sort?: Record<"digg_total" | "forward_total" | "collection_num", "ASC" | "DESC">;
};
export type PostAssetType = {
  hasText: boolean;
  hasImage: boolean;
  hasAudio: boolean;
  hasVideo: boolean;
};
export interface AssetItemDto {
  platform: Platform;
  asset_id: string;
  /** 作者信息 */
  author: PostUserInfo;
  /** 作品类型 */
  type: PostAssetType;
  content_text: string | null;
  content_text_structure: TextStructure[] | null;
  publish_time: string | null;
  ip_location: string | null;
  url?: string;

  videoList?: (VideoAssetDto | undefined)[];
  audioList?: (AudioAssetDto | undefined)[];
  imageList?: (ImageAssetDto | undefined)[];
}
export type PostUserInfo = {
  user_name: string;
  user_id: string;
  avatar_url: string;
  home_page?: string;
};
export * from "./common.dto.ts";
export type { TextStructure };
