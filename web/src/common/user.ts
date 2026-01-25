import { queryClient } from "@/request/client.ts";
import { ijiaCookie } from "@/stores/cookie.ts";

/** 仅开放模式使用， cookie 可能会设置 httpOnly */
export function getUserToken(): string | undefined {
  return ijiaCookie.accessToken;
}

export function loginByAccessToken(accessToken: string) {
  ijiaCookie.accessToken = accessToken;
}

export function clearUserCache() {
  queryClient.clear();
}
