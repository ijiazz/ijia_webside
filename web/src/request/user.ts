import { QueryOptions } from "@tanstack/react-query";
import { api, IGNORE_ERROR_MSG, IGNORE_UNAUTHORIZED_REDIRECT } from "./client.ts";

export const USER_QUERY_KEY_PREFIX = "user";

export const CurrentUserInfoQueryOption = {
  queryKey: [USER_QUERY_KEY_PREFIX, "/user/basic_info"],
  queryFn: () => {
    return api["/user/basic_info"]
      .get({ [IGNORE_UNAUTHORIZED_REDIRECT]: true, [IGNORE_ERROR_MSG]: true })
      .catch(() => null);
  },
} satisfies QueryOptions;

export const CurrentUserProfileQueryOption = {
  queryKey: [USER_QUERY_KEY_PREFIX, "/user/profile"],
  queryFn: () => api["/user/profile"].get(),
} satisfies QueryOptions;
