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
    const userId = +info.userId;
    if (!Number.isInteger(userId)) return null; // 确保 userId 是整数
    const isExpired = info.exp && Date.now() > info.exp;
    return {
      userId,
      valid: !isExpired,
      isExpired,
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
