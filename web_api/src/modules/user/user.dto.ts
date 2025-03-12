import type { Platform } from "@ijia/data/db";

export type UserProfileDto = {
  user_id: number;
  nickname?: string;
  avatar_url?: string;
  /** 是否已认证 */
  is_official?: boolean;
  primary_class?: {
    class_id: number;
    class_name: string;
  };
};
export type BindPlatformCheckParam = {
  platformList: {
    platform: Platform;
    userHomeLink?: string;
    pla_uid?: string;
  }[];
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
  platformList: { platform: Platform; pla_uid: string }[];
};
export type DeleteBindPlatformParam = {
  bindKeyList: string[];
};
export type UpdateUserProfileParam = {
  /** 班级 */
  publicClassId?: number | null;

  notice?: {
    /** 是否接收直播通知 */
    live?: boolean;
  };
};
