import { EmailCaptchaQuestion } from "../captcha/captcha.dto.ts";
import type {
  CreateUserProfileParam,
  CreateUserProfileResult,
  UserLoginParamDto,
  UserLoginResultDto,
  RequestSignupEmailCaptchaParam,
  ChangePasswordParam,
} from "./passport.dto.ts";

export interface PassportApi {
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
    body: RequestSignupEmailCaptchaParam;
  };
  /** 修改密码 */
  "POST /passport/change_password": {
    response: null;
    body: ChangePasswordParam;
  };
}
