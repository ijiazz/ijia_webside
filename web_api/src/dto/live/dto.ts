import { InfiniteListDto, ListDto, Platform } from "../common.ts";

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

export type BulletChat = {
  text: string;
  id: string;
  like_count: number;

  user: {
    user_name: string;
    avatar_url: string;
    user_id: string;
  };
};

export type GetBulletChatParam = {
  index?: number;
};
export type GetBulletChatListRes = InfiniteListDto<BulletChat> & {};
