import type { TextStructure, AssetMediaDto } from "../../common.ts";

export type PostBase = {
  content_text: string | null;
  content_text_structure: TextStructure[] | null;
  publish_time?: string | null;
  update_time?: string | null;
  ip_location: string | null;
  media: (AssetMediaDto | undefined)[];
};
export type PostUserInfo = {
  user_name: string;
  user_id: string;
  avatar_url: string;
  home_page?: string;
};
