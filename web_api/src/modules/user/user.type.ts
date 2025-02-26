import type { Platform } from "@ijia/data/db";
import type { EmailVerificationReply } from "../verification_code/mod.ts";

export type CreateUserProfileParam = {
  email: string;
  emailVerification: EmailVerificationReply;
  password?: string;
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
  id: string;
  password: string;
  passwordNoHash?: boolean;
};
export type UserLoginByEmailParam = {
  method: LoginType.email;
  email: string;
  password: string;
  passwordNoHash?: boolean;
};
export type UserLoginParamDto = UserLoginByIdParam | UserLoginByEmailParam;

export enum LoginType {
  id = "id",
  email = "email",
}

export type SendEmailVerificationCodeParam = {
  email: string;
};
