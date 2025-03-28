import { Platform } from "@ijia/data/db";
import { GetListOption } from "../dto_common.ts";
import { ImageInfoDto, MulFormat, AssetUserInfo } from "./common.dto.ts";

export type GetAssetListParam = GetListOption & {
  platform?: Platform;
  userId?: string;
  s_content?: string;
  s_author?: string;

  sort?: Record<"publish_time" | "digg_total" | "forward_total" | "collection_num", "ASC" | "DESC">;
};

export interface AssetItemDto {
  platform: Platform;
  asset_id: string;
  /** 作者信息 */
  author: AssetUserInfo;
  /** 作品类型 */
  type: number;
  content_text: string | null;
  cover?: MulFormat<ImageInfoDto>;
  publish_time: Date | null;
  ip_location: string | null;
  url?: string;

  // videoList: VideoInfoDto[];
  // audioList: AudioInfoDto[];
  // imageList: ImageInfoDto[];
  // videoUrlList?: string[];
  // audioUrlList?: string[];
  // imageUrlList?: string[];
}
