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
  password: string;
  passwordNoHash?: boolean;
};
export type UserLoginByEmailParam = {
  method: LoginType.email;
  captcha?: ImageCaptchaReply;

  email: string;
  password: string;
  passwordNoHash?: boolean;
};
export type UserLoginParamDto = UserLoginByIdParam | UserLoginByEmailParam;

export enum LoginType {
  id = "id",
  email = "email",
}

export type RequestSignupEmailCaptchaParam = {
  captchaReply: ImageCaptchaReply;
  email: string;
};
export type ChangePasswordParam = {
  newPassword: string;
  oldPassword: string;
  passwordNoHash?: boolean;
  // userId?: string;
};
export type PassportConfig = {
  signupTip?: string;
  /** 是否开启注册 */
  signupEnabled?: boolean;

  /** 登录关闭验证码 */
  loginCaptchaDisabled?: boolean;
  loginTip?: string;
};
