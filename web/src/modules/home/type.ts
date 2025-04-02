import type { Platform } from "@/common/third_part_account.tsx";

export type HomePageDto = {
  god_user: GodUserDto;
  god_user_platforms: GodPlatformDto[];
  current_user: CurrentUserDto | null;
};

export type GodPlatformDto = {
  user_id: string;
  platform: Platform;
  user_name: string;

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
  post_total?: number;
  post_digg_total: number;
};

export type CurrentUserDto = {
  user_id: string;
  user_name: string;
  encountering_time: string | null;
};
