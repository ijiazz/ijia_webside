import type { Platform } from "@ijia/data/db";

export type CreateUserProfileParam = {
  email: string;
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
  message?: string;
  redirect?: string;
  tip?: {
    title: string;
    content: string;
  };
};
export type UserLoginByIdParam = {
  method: "id";
  id: string;
  password: string;
  passwordNoHash?: boolean;
};
export type UserLoginByEmailParam = {
  method: "email";
  email: string;
  password: string;
  passwordNoHash?: boolean;
};
export type UserLoginParamDto = UserLoginByIdParam | UserLoginByEmailParam;

export enum LoginType {
  id = "id",
  email = "email",
}
