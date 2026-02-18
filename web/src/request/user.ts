import { QueryOptions } from "@tanstack/react-query";
import { api, IGNORE_UNAUTHORIZED_REDIRECT } from "./client.ts";
import { User, UserConfig } from "@/api.ts";

export const USER_QUERY_KEY_PREFIX = "user";

export type GetCurrentUserInfoOption = {
  ignoreUnAuthorizeRedirect?: boolean;
};
export function getCurrentUserInfoQueryOption(option: GetCurrentUserInfoOption = {}) {
  return {
    queryKey: [USER_QUERY_KEY_PREFIX, "currentUser"],
    queryFn: (): Promise<User> => {
      return api["/user"].get({ [IGNORE_UNAUTHORIZED_REDIRECT]: option.ignoreUnAuthorizeRedirect });
    },
  } satisfies QueryOptions;
}

export function getUserInfoQueryOption(option: { userId: number | string | undefined }) {
  return {
    queryKey: [USER_QUERY_KEY_PREFIX, "user"],
    queryFn: async (): Promise<User> => {
      const targetUserId = typeof option.userId === "string" ? Number.parseInt(option.userId) : option.userId;
      const user = await api["/user"].get({ query: { userId: option.userId } });

      if (user.user_id !== targetUserId) {
        throw new Error("请求的用户ID与返回的用户ID不匹配");
      }
      return user;
    },
  } satisfies QueryOptions;
}
export const CurrentUserProfileQueryOption = {
  queryKey: [USER_QUERY_KEY_PREFIX, "/user/profile"],
  queryFn: (): Promise<UserConfig> => api["/user/profile"].get(),
} satisfies QueryOptions;
