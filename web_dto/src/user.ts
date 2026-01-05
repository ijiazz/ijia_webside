import type { Platform } from "./common.ts";

export interface UserApi {
  /** 绑定平台 */
  "POST /user/bind_platform": {
    response: null;
    body: BindPlatformParam;
  };
  /** 解除平台绑定 */
  "DELETE /user/bind_platform": {
    response: null;
    body: DeleteBindPlatformParam;
  };
  /** 绑定平台前检测是否能够绑定 */
  "POST /user/bind_platform/check": {
    response: BindPlatformCheckDto;
    body: BindPlatformCheckParam;
  };

  /** 获取用户基本信息 */
  "GET /user/basic_info": {
    response: UserBasicDto;
  };
  /** 获取用户配置信息 */
  "GET /user/profile": {
    response: UserInfoDto;
  };
  /** 同步平台用户信息 */
  "POST /user/profile/sync": {
    response: null;
    body: ProfileSyncParam;
  };
  /** 修改用户信息 */
  "PATCH /user/profile": {
    response: null;
    body: UpdateUserProfileParam;
  };
}

export type UserBasicDto = {
  user_id: number;
  email: string;
  nickname?: string;
  avatar_url?: string;
  /** 是否已认证 */
  is_official?: boolean;
  primary_class?: {
    class_id: number;
    class_name: string;
  };
};
export type UserInfoDto = UserBasicDto & {
  bind_accounts: BindAccountDto[];
  profile?: UserProfileDto;
};
export type UserProfileDto = {
  live_notice: boolean;
  acquaintance_time: Date | null;
  comment_stat_enabled: boolean;
};

export type UserNoticeSettingDto = {
  /** 是否接收直播通知 */
  live?: boolean;
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
  acquaintance_time?: Date | string | null;
  /** 是否开启年度评论统计 */
  comment_stat_enabled?: boolean;
  notice_setting?: UserNoticeSettingDto;
};
