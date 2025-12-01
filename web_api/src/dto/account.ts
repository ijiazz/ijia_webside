import { EmailCaptchaReply, ImageCaptchaReply } from "./captcha.ts";

export type GetAccountAuthTokenParam = {
  emailCaptcha: EmailCaptchaReply;
};
export type AccountSendEmailCaptchaParam = {
  captchaReply: ImageCaptchaReply;
};

export type AccountAuthenticateToken = {
  account_token: string;
};
export type ChangeEmailParam = {
  newEmail: string;
  accountToken: string;
  /** 新邮箱的验证码 */
  emailCaptcha: EmailCaptchaReply;
};
