import type { EmailCaptchaReply, ImageCaptchaReply } from "../captcha/captcha.dto.ts";

export type CreateUserProfileParam = {
  email: string;
  emailCaptcha?: EmailCaptchaReply;
  password?: string;
  passwordNoHash?: boolean;
};
export type CreateUserProfileResult = {
  userId: number;
  jwtKey: string;
};

export type UserLoginResultDto = {
  success: boolean;
  token: string;
  maxAge?: number;
  message?: string;
  redirect?: string;
  tip?: {
    title: string;
    content: string;
  };
};
export type UserLoginByIdParam = {
  method: LoginType.id;
  captcha?: ImageCaptchaReply;

  id: string;
  password?: string;
  passwordNoHash?: boolean;
};
export type UserLoginByEmailParam = {
  method: LoginType.email;
  captcha?: ImageCaptchaReply;

  email: string;
  password?: string;
  passwordNoHash?: boolean;
};
export type UserLoginParamDto = UserLoginByIdParam | UserLoginByEmailParam;

export enum LoginType {
  id = "id",
  email = "email",
}

export type RequestSendEmailCaptchaParam = {
  captchaReply: ImageCaptchaReply;
  email: string;
};
export type ChangePasswordParam = {
  newPassword: string;
  oldPassword: string;
  passwordNoHash?: boolean;
};

export type ResetPasswordParam = {
  email: string;
  emailCaptcha: EmailCaptchaReply;
  newPassword: string;
  passwordNoHash?: boolean;
};

export type PassportConfig = {
  signupTip?: string | null;
  /** 是否开启注册 */
  signupEnabled?: boolean | null;

  /** 登录关闭验证码 */
  loginCaptchaDisabled?: boolean | null;
  loginTip?: string | null;
};
