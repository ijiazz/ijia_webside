import { UserBasicDto } from "@/api.ts";
import { useHoFetch } from "@/hooks/http.ts";
import { useAsync } from "@/hooks/async.ts";
import { useEffect, useMemo } from "react";
import { toFileUrl } from "./http.ts";
import Cookie from "js-cookie";
import { getUrlByRoute } from "@/app.ts";

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
        user = api["/user/basic_info"].get().then((res) => ({
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
  return Cookie.get("jwt-token");
}
export function userLogout() {
  Cookie.remove("jwt-token");
  location.href = getUrlByRoute("/passport/login");
}
export function loginByAccessToken(jwtToken: string) {
  Cookie.set("jwt-token", jwtToken);
}
