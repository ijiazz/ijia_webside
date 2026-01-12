import * as jwtLib from "hono/jwt";
import { ENV } from "@/config.ts";
import {
  AuthToken,
  AccessToken,
  SignAccessTokenOption,
  checkIjiaTokenData,
  AccessUserData,
  AuthTokenType,
  AccessJwtPayload,
} from "@ijia/data/auth";

export type { SignInfo, SignAccessTokenOption, AccessToken, AccessUserData, AuthTokenType } from "@ijia/data/auth";

const authToken = new AuthToken<AccessJwtPayload>({
  parseSysJWT,
  signSysJWT,
  checkData: checkIjiaTokenData,
});

export async function signAccessToken(
  userId: number,
  option?: SignAccessTokenOption,
): Promise<AccessToken<AccessUserData>>;
export async function signAccessToken(
  data: AccessUserData | number,
  option: SignAccessTokenOption = {},
): Promise<AccessToken<AccessUserData>> {
  return authToken.signAccessToken(
    typeof data === "number" ? { userId: data, type: AuthTokenType.User } : data,
    option,
  );
}

export async function verifyAccessToken(accessToken: string): Promise<AccessToken<AccessUserData>> {
  const res = await authToken.verifyAccessToken(accessToken);
  if (res.data.type !== AuthTokenType.User) {
    throw new Error("不支持的令牌类型");
  }
  return res as AccessToken<AccessUserData>;
}

const JWT_KEY = ENV.JWT_KEY;

export function signSysJWT(data: Record<string, any>) {
  return jwtLib.sign(data, JWT_KEY, "HS256");
}
export async function parseSysJWT(accessToken: string): Promise<unknown> {
  return jwtLib.verify(accessToken, JWT_KEY, "HS256");
}
export const INTERNAL_MESSAGE_TOKEN = await authToken
  .signAccessToken({ type: AuthTokenType.InternalMessage })
  .then((accessToken) => {
    return accessToken.token;
  });
