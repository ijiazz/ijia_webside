import { UserBasicDto } from "@/api.ts";
import { IGNORE_UNAUTHORIZED_REDIRECT, IGNORE_ERROR_MSG, useHoFetch } from "@/hooks/http.ts";
import { useAsync } from "@/hooks/async.ts";
import { useEffect, useMemo } from "react";
import { toFileUrl } from "./http.ts";
import { getUrlByRoute } from "@/app.ts";
import { ijiaCookie } from "@/stores/cookie.ts";

export type UserProfileBasic = UserBasicDto & {
  userIdStr: string;
};

export type UseCurrentUser = {
  refresh: (token?: string) => Promise<boolean>;
  logout(): void;

  loading: boolean;
  error?: any;
  value?: UserProfileBasic | undefined;
};
let user: Promise<UserProfileBasic> | UserProfileBasic | undefined;
const userEvent = new EventTarget();

export function useCurrentUser(option: { manual?: boolean } = {}): UseCurrentUser {
  const { manual } = option;
  const { api } = useHoFetch();
  const { result, run, reset } = useAsync(
    (force?: boolean) => {
      if (!user || force) {
        if (!getUserToken()) return;
        user = api["/user/basic_info"]
          .get({ [IGNORE_UNAUTHORIZED_REDIRECT]: true, [IGNORE_ERROR_MSG]: true })
          .then((res) => ({
            ...res,
            avatar_url: toFileUrl(res.avatar_url),
            userIdStr: res.user_id.toString().padStart(6),
          }));
      }
      return user;
    },
    { autoRunArgs: manual ? undefined : [] },
  );

  useEffect(() => {
    const listen = () => run();
    userEvent.addEventListener("refresh", listen);
    return () => {
      userEvent.removeEventListener("refresh", listen);
    };
  }, []);
  return useMemo(() => {
    return {
      ...result,
      refresh: (token?: string) => {
        if (token) loginByAccessToken(token);
        return run(true).then(() => userEvent.dispatchEvent(new Event("refresh")));
      },
      logout() {
        reset();
        user = undefined;
        userLogout();
      },
    };
  }, [result]);
}
export function getUserToken(): string | undefined {
  return ijiaCookie.accessToken;
}
export function userLogout() {
  ijiaCookie.accessToken = undefined;
  location.href = getUrlByRoute("/passport/login");
}
export function loginByAccessToken(accessToken: string) {
  ijiaCookie.accessToken = accessToken;
}

export function getUserInfoFromToken(): null | JwtUserInfo {
  const token = getUserToken();
  if (!token) return null;
  try {
    const info = parseJwt(token);
    const result = verifySignInfo(info, 1);
    const userId = +info.userId;
    if (!Number.isInteger(userId)) return null; // 确保 userId 是整数
    return {
      userId,
      valid: !result.isExpired,
      isExpired: result.isExpired,
    };
  } catch (error) {
    console.error("JWT 解析失败", error);
    return null;
  }
}

export type JwtUserInfo = {
  userId: number;
  valid: boolean;
  isExpired?: boolean;
};
function parseJwt(token: string) {
  const content = token.split(".")[1];
  const raw = content.replaceAll("-", "+").replaceAll("_", "/");

  const value = decodeURIComponent(atob(raw));

  return JSON.parse(value);
}
type SignVerifyResult = {
  isExpired: boolean;
  needRefresh: boolean;
};
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
type AccessTokenData = {
  userId: string;
};

type SignInfo = AccessTokenData & {
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
    /** 刷新令牌存活时间, 单位秒。如果不存在，则没有期限 */
    exp?: number;
  };
  version: number;
};
