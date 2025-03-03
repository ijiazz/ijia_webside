import type { Platform } from "@ijia/data/db";
import type { EmailCaptchaReply, ImageCaptchaReply } from "../captcha/Captcha.type.ts";

export type CreateUserProfileParam = {
  email: string;
  emailCaptcha?: EmailCaptchaReply;
  password?: string;
  passwordNoHash?: boolean;
  /** 班级 id */
  classId?: number[];
};
export type CreateUserProfileResult = {
  userId: number;
};

export type UserProfileDto = {
  userId: number;
  nickname?: string;
  avatarUrl?: string;
};
export type BindPlatformParam = {
  userId: string;
  platformList: {
    platform: Platform;
    userHomeLink?: string;
    pla_uid?: string;
  }[];
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
