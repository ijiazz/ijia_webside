import * as jwtLib from "hono/jwt";
import { ENV } from "@/config.ts";

export type AccessTokenData = {
  userId: string;
};

export type SignInfo = AccessTokenData & {
  /**
   * 令牌存活秒数。
   * 如果不存在，则没有过期时间
   */
  survivalSeconds?: number;
  /** 签发时间，时间戳。整数部分精确到秒 */
  issueTime: number;

  /** 令牌刷新 */
  refresh?: {
    /**
     * 刷新令牌存活时间，单位秒，相对于 signTime。超过这个时间，不允许刷新。也就是说，必须在这个时间内容使用过刷新令牌，用于保活
     * 如果不存在，则没有刷新时间
     */
    keepAliveSeconds?: number;
    /** 刷新令牌存活时间, 单位秒。如果不存在，则没有期限。它必须大于 keepAliveSeconds */
    exp?: number;
  };
  version: number;
};
export type SignResult = {
  token: string;
  info: SignInfo;
  /** 令牌最大存活时间，单位秒 */
  maxAge?: number;
};

export type SignAccessTokenOption = {
  survivalSeconds?: number; // 访问令牌存活时间

  refreshKeepAliveSeconds?: number; // 可选的访问令牌刷新间隔时间
  refreshSurvivalSeconds?: number; // 可选的刷新令牌存活时间
};
export const ACCESS_TOKEN_VERSION = 1;
export async function signAccessToken(userId: number, option: SignAccessTokenOption = {}): Promise<SignResult> {
  const signTime = Date.now() / 1000;
  const { survivalSeconds, refreshKeepAliveSeconds, refreshSurvivalSeconds } = option;

  const body: SignInfo = { userId: userId.toString(), issueTime: signTime, version: ACCESS_TOKEN_VERSION };

  if (typeof survivalSeconds === "number") body.survivalSeconds = survivalSeconds;

  if (refreshKeepAliveSeconds || refreshSurvivalSeconds) {
    body.refresh = {};
    if (typeof refreshKeepAliveSeconds === "number") {
      body.refresh.keepAliveSeconds = refreshKeepAliveSeconds;
    }
    if (typeof refreshSurvivalSeconds === "number") {
      if (refreshKeepAliveSeconds && refreshSurvivalSeconds < refreshKeepAliveSeconds) {
        throw new Error("refreshSurvivalSeconds must be greater than refreshKeepAliveSeconds");
      }
      body.refresh.exp = signTime + refreshSurvivalSeconds;
    }
  }
  const token = await signSysJWT(body);
  return {
    info: body,
    token,
    maxAge: getMaxAge(body),
  };
}
export async function refreshAccessToken(info: SignInfo): Promise<SignResult> {
  const body = { ...info, issueTime: Date.now() / 1000 } satisfies SignInfo;
  const token = await signSysJWT(body);

  return {
    token,
    info: body,
    maxAge: getMaxAge(body),
  };
}

export type SignVerifyResult = {
  isExpired: boolean;
  needRefresh: boolean;
};
export async function verifyAccessToken(accessToken: string): Promise<{ result: SignVerifyResult; info: SignInfo }> {
  const data: SignInfo = (await parseSysJWT(accessToken)) as any;

  const result = verifySignInfo(data, ACCESS_TOKEN_VERSION);
  return { result, info: data };
}
function verifySignInfo(data: SignInfo, requiredVersion: number): SignVerifyResult {
  if (!data.userId || typeof data.userId !== "string") throw new Error("缺少用户名");
  if (typeof data.issueTime !== "number") throw new Error("缺少签名时间");
  const now = Date.now() / 1000;
  const refresh = data.refresh;
  const versionExpired = data.version !== requiredVersion;
  const isExpired = data.survivalSeconds && data.survivalSeconds + data.issueTime < now;
  const result: SignVerifyResult = {
    isExpired: !!isExpired || versionExpired,
    needRefresh: false,
  };
  if (isExpired && !versionExpired && refresh) {
    const refreshExpired = refresh.exp && refresh.exp < now;
    if (!refreshExpired) {
      const keepAliveExpired = refresh.keepAliveSeconds && refresh.keepAliveSeconds + data.issueTime < now;
      if (!keepAliveExpired) {
        result.needRefresh = true;
        result.isExpired = false; // 刷新令牌不算过期
      }
    }
  }

  return result;
}
function getMaxAge(info: SignInfo) {
  let maxAge: number | undefined;
  const refresh = info.refresh;
  if (info.survivalSeconds && refresh) {
    const refreshMaxAge = refresh.exp ? refresh.exp - Date.now() / 1000 : refresh.keepAliveSeconds; // 刷新令牌的最大存活时间
    if (refreshMaxAge) maxAge = Math.max(info.survivalSeconds, refreshMaxAge);
    else maxAge = info.survivalSeconds;
  } else {
    maxAge = info.survivalSeconds || undefined;
  }
  return maxAge;
}

export async function hashPwd(pwd: string, salt: string = "") {
  const data = await crypto.subtle.digest("SHA-512", new TextEncoder().encode(salt + pwd));
  const u8Arr = new Uint8Array(data, 0, data.byteLength);
  let str = "";
  for (let i = 0; i < u8Arr.length; i++) {
    str += u8Arr[i].toString(16);
  }
  return str;
}

const JWT_KEY = ENV.JWT_KEY;

export function signSysJWT(data: Record<string, any>) {
  return jwtLib.sign(data, JWT_KEY, "HS256");
}
export async function parseSysJWT(accessToken: string): Promise<Record<string, any>> {
  return jwtLib.verify(accessToken, JWT_KEY, "HS256");
}
