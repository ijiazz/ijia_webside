import { TextStructure } from "@ijia/data/db";
import { AssetMediaDto } from "../../../dto/media.dto.ts";

export type { TextStructure };
export type PostAssetType = {
  hasText: boolean;
  hasImage: boolean;
  hasAudio: boolean;
  hasVideo: boolean;
};

export type PostItemBase = {
  /** 作品类型 */
  type: PostAssetType;
  content_text: string | null;
  content_text_structure: TextStructure[] | null;
  publish_time?: string | null;
  update_time?: string | null;
  create_time?: string | null;
  ip_location: string | null;
  media: (AssetMediaDto | undefined)[];
};
export type PostUserInfo = {
  user_name: string;
  user_id: string;
  avatar_url: string;
  home_page?: string;
};
