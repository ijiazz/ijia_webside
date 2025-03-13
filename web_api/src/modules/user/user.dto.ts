import type { Platform } from "@ijia/data/db";

export type UserProfileDto = {
  user_id: number;
  nickname?: string;
  avatar_url?: string;
  /** 是否已认证 */
  is_official?: boolean;
  bind_accounts: BindAccountDto[];
  primary_class?: {
    class_id: number;
    class_name: string;
  };
};
export type BindAccountDto = {
  platform: Platform;
  pla_uid: string;
  user_name?: string | null;
  avatar_url?: string | null;
  create_time: string;
  last_update_time: string;
  key: string;
};
export type BindPlatformCheckParam = {
  platformList: {
    platform: Platform;
    userHomeLink?: string;
    platformUseId?: string;
  }[];
};
export type ProfileSyncParam = {
  bindKey:
    | string
    | {
        platform: Platform;
        pla_uid: string;
      };
};
export type BindPlatformCheckDto = {
  platformUser: {
    pla_uid: string;
    username: string;
    description: string;
    avatarPath: string;
  };
  /** 如果存在，说明改账号已经被绑定 */
  bind?: {
    user_id: number;
    platform: Platform;
    pla_uid: string;
  };
};
export type BindPlatformParam = {
  account: { platform: Platform; pla_uid: string };
};
export type DeleteBindPlatformParam = {
  bindKey: string;
};
export type UpdateUserProfileParam = {
  /** 班级 */
  publicClassId?: number | null;

  notice?: {
    /** 是否接收直播通知 */
    live?: boolean;
  };
};
