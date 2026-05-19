import { createHttpUserInfo, ERRORS, HttpUserInfo } from "@ijia/school-db/auth";
import { HttpError, RequiredLoginError } from "@/common/errors.ts";
import { verifyAccessToken } from "@/common/jwt.ts";

export type UserInfo = HttpUserInfo;

export function createUserInfo(accessToken?: string): UserInfo {
  return createHttpUserInfo({
    verifyAccessToken,
    accessToken,
    createError: ({ code, message }) => {
      switch (code) {
        case ERRORS.AccountFrozen:
          return new HttpError(423, message);
        case ERRORS.AccountNotExist:
          return new HttpError(404, message);

        case ERRORS.TokenExpired:
        case ERRORS.RequiredLogin:
        default:
          return new RequiredLoginError(message);
      }
    },
    rootRoleId: Role.Root,
  });
}
export enum Role {
  Root = "root",
  Admin = "admin",
  PostReviewer = "PostReviewer",
}
