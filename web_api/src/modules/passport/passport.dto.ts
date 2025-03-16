import type { EmailCaptchaReply, ImageCaptchaReply } from "../captcha/Captcha.dto.ts";

export type CreateUserProfileParam = {
  email: string;
  emailCaptcha?: EmailCaptchaReply;
  password?: string;
  passwordNoHash?: boolean;
};
export type CreateUserProfileResult = {
  userId: number;
  jwtKey:string
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
  userId?: string;
};
