import {
  BindPlatformCheckDto,
  BindPlatformCheckParam,
  BindPlatformParam,
  DeleteBindPlatformParam,
  ProfileSyncParam,
  UpdateUserProfileParam,
  UserBasicDto,
  UserInfoDto,
} from "./user.dto.ts";

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
