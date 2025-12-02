export * from "./passport/dto.ts";

import type { EmailCaptchaQuestion } from "./captcha.ts";
import {
  AccountAuthenticateToken,
  AccountSendEmailCaptchaParam,
  ChangeEmailParam,
  GetAccountAuthTokenParam,
} from "./account.ts";
import {
  ChangePasswordParam,
  CreateUserProfileParam,
  CreateUserProfileResult,
  PassportConfig,
  RequestSendEmailCaptchaParam,
  ResetPasswordParam,
  UserLoginParamDto,
  UserLoginResultDto,
} from "./passport/dto.ts";

export interface PassportApi {
  /** 获取登录相关的配置 */
  "GET /passport/config": {
    response: PassportConfig;
  };
  /** 登录 */
  "POST /passport/login": {
    response: UserLoginResultDto;
    body: UserLoginParamDto;
  };
  /** 注册用户 */
  "POST /passport/signup": {
    response: CreateUserProfileResult;
    body: CreateUserProfileParam;
  };
  /** 注册用户发送邮箱验证码 */
  "POST /passport/signup/email_captcha": {
    response: EmailCaptchaQuestion;
    body: RequestSendEmailCaptchaParam;
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

  /** 发送获取 accountToken 的邮箱验证码 */
  "POST /passport/sign_account_token/email_captcha": {
    response: EmailCaptchaQuestion;
    body: AccountSendEmailCaptchaParam;
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
  /** 修改邮箱发送验证码 */
  "POST /passport/change_email/email_captcha": {
    response: EmailCaptchaQuestion;
    body: RequestSendEmailCaptchaParam;
  };
}
