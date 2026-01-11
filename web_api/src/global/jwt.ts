import * as jwtLib from "hono/jwt";
import { ENV } from "@/config.ts";
import { AuthToken, SignInfo, AccessToken, SignAccessTokenOption } from "@ijia/data/auth";

export type { SignInfo, SignAccessTokenOption, AccessToken } from "@ijia/data/auth";
export type AccessUserData = { userId: number };
export type SignResult2 = {
  token: string;
  maxAge?: number;
};

export const authToken = new AuthToken<AccessUserData>({
  parseSysJWT: async (token) => {
    const data = (await parseSysJWT(token)) as SignInfo<AccessUserData>;
    if (!Number.isSafeInteger(data.data.userId)) throw new Error("Invalid userId in token");
    return data;
  },
  signSysJWT,
});

export async function signAccessToken(
  userId: number,
  option: SignAccessTokenOption = {},
): Promise<AccessToken<AccessUserData>> {
  return authToken.signAccessToken({ userId: userId }, option);
}

export async function verifyAccessToken(accessToken: string): Promise<AccessToken<AccessUserData>> {
  return authToken.verifyAccessToken(accessToken);
}

const JWT_KEY = ENV.JWT_KEY;

export function signSysJWT(data: Record<string, any>) {
  return jwtLib.sign(data, JWT_KEY, "HS256");
}
export async function parseSysJWT(accessToken: string): Promise<Record<string, any>> {
  return jwtLib.verify(accessToken, JWT_KEY, "HS256");
}
