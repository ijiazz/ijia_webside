export * from "./passport/dto.ts";

import type { AccountAuthenticateToken, ChangeEmailParam, GetAccountAuthTokenParam } from "./passport/account.ts";
import type {
  ChangePasswordParam,
  CreateUserProfileParam,
  CreateUserProfileResult,
  PassportConfig,
  ResetPasswordParam,
  UserLoginParam,
  UserLoginResult,
} from "./passport/dto.ts";

export interface PassportApi {
  /** 获取登录相关的配置 */
  "GET /passport/config": {
    response: PassportConfig;
  };
  /** 登录 */
  "POST /passport/login": {
    response: UserLoginResult;
    body: UserLoginParam;
  };
  /** 注册用户 */
  "POST /passport/signup": {
    response: CreateUserProfileResult;
    body: CreateUserProfileParam;
  };

  /** 重置密码 */
  "POST /passport/reset_password": {
    response: null;
    body: ResetPasswordParam;
  };
}
export interface PassportApi {
  /** 修改密码 */
  "POST /passport/change_password": {
    response: null;
    body: ChangePasswordParam;
  };

  /** 获取 accountToken。 */
  "POST /passport/sign_account_token": {
    response: AccountAuthenticateToken;
    body: GetAccountAuthTokenParam;
  };

  /** 修改邮箱 */
  "POST /passport/change_email": {
    response: null;
    body: ChangeEmailParam;
  };
}
