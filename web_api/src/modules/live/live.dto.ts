import { Platform } from "../dto.ts";
import { ListDto } from "../dto_common.ts";

export type UserAvatarDto = {
  avatar_url: string;
  id: number;
  name: string;
  width?: number;
  height?: number;
};
export type ScreenAvatarRes = ListDto<UserAvatarDto> & { limit: number };

export type HomePageRes = {
  god_user: GodUserDto;
  god_user_platforms: GodPlatformDto[];
  current_user: CurrentUserDto | null;
};

export type GodPlatformDto = {
  user_id: string;
  platform: Platform;
  user_name: string;
  home_url?: string | null;
  avatar_url?: string | null;
  cover_url?: string | null;

  stat: PlatformUserStat;
};
export type GodUserDto = {
  user_name: string;
  avatar_url?: string | null;
};
export type PlatformUserStat = {
  followers_count: number;
};

export type CurrentUserDto = {
  user_id: string;
  user_name: string;
  encountering_time: string | null;
};
