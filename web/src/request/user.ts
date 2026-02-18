import { QueryOptions } from "@tanstack/react-query";
import { api, IGNORE_UNAUTHORIZED_REDIRECT } from "./client.ts";
import { User, UserConfig } from "@/api.ts";

export const USER_QUERY_KEY_PREFIX = "user";

export type GetCurrentUserInfoOption = {
  ignoreUnAuthorizeRedirect?: boolean;
};
export function getCurrentUserInfoQueryOption(option: GetCurrentUserInfoOption = {}) {
  return {
    queryKey: [USER_QUERY_KEY_PREFIX, "/user/basic_info"],
    queryFn: (): Promise<User> => {
      return api["/user/basic_info"].get({ [IGNORE_UNAUTHORIZED_REDIRECT]: option.ignoreUnAuthorizeRedirect });
    },
  } satisfies QueryOptions;
}

export const CurrentUserProfileQueryOption = {
  queryKey: [USER_QUERY_KEY_PREFIX, "/user/profile"],
  queryFn: (): Promise<UserConfig> => api["/user/profile"].get(),
} satisfies QueryOptions;
