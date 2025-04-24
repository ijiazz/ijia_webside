import { EmailCaptchaQuestion } from "../captcha/captcha.dto.ts";
import {
  AccountAuthenticateToken,
  ChangeEmailParam,
  GetAccountAuthTokenParam,
  AccountSendEmailCaptchaParam,
} from "./account.dto.ts";
import type {
  CreateUserProfileParam,
  CreateUserProfileResult,
  UserLoginParamDto,
  UserLoginResultDto,
  RequestSendEmailCaptchaParam,
  ChangePasswordParam,
  PassportConfig,
  ResetPasswordParam,
} from "./passport.dto.ts";

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
  /** 重置密码发送验证码 */
  "POST /passport/reset_password/email_captcha": {
    response: EmailCaptchaQuestion;
    body: RequestSendEmailCaptchaParam;
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
