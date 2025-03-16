import type { Platform } from "@ijia/data/db";

export type UserBasicDto = {
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
export type UserProfileDto = UserBasicDto & {
  bind_accounts: BindAccountDto[];
  notice_setting?: UserNoticeSettingDto;
};

export type UserNoticeSettingDto = {
  /** 是否接收直播通知 */
  live?: boolean | null;
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
    username?: string | null;
    description?: string | null;
    avatarPath?: string | null;
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
  primary_class_id?: number | null;

  notice_setting?: UserNoticeSettingDto;
};
