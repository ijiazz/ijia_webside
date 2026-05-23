import { AccessUserData, ERRORS, HttpUserInfo, JWTAuth } from "@ijia/school-db/auth";
import { HttpError, RequiredLoginError } from "@/common/errors.ts";
import { verifyAccessToken } from "@/common/jwt.ts";

function createError({ code, message }: { code: string; message: string }) {
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
}
export class UserInfo extends HttpUserInfo {
  constructor(accessToken?: string) {
    const jwtAuth = new JWTAuth({ accessToken, verifyAccessToken, createError });
    super(jwtAuth, { createError, rootRoleId: Role.Root });
    this.#jwtAuth = jwtAuth;
  }
  #jwtAuth: JWTAuth<AccessUserData>;
  override checkUpdateToken(force = false) {
    return this.#jwtAuth.checkUpdateToken(force);
  }
}
export function createUserInfo(accessToken?: string): UserInfo {
  return new UserInfo(accessToken);
}
export enum Role {
  Root = "root",
  Admin = "admin",
  PostReviewer = "PostReviewer",
}
