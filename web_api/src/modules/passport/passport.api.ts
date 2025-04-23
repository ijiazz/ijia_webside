import { EmailCaptchaQuestion } from "../captcha/captcha.dto.ts";
import type {
  CreateUserProfileParam,
  CreateUserProfileResult,
  UserLoginParamDto,
  UserLoginResultDto,
  RequestSendEmailCaptchaParam,
  ChangePasswordParam,
  PassportConfig,
  ResetPasswordParam,
  ChangeEmailParam,
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
  /** 修改密码 */
  "POST /passport/change_password": {
    response: null;
    body: ChangePasswordParam;
  };
  /** 重置密码 */
  "POST /passport/reset_password": {
    response: null;
    body: ResetPasswordParam;
  };
  /** 找回密码发送验证码 */
  "POST /passport/reset_password/email_captcha": {
    response: EmailCaptchaQuestion;
    body: RequestSendEmailCaptchaParam;
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
