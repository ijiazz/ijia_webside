import type { Platform } from "@ijia/data/db";

export type UserProfileDto = {
  user_id: number;
  nickname?: string;
  avatar_url?: string;
};
export type BindPlatformParam = {
  platformList: {
    platform: Platform;
    userHomeLink?: string;
    pla_uid?: string;
  }[];
};
