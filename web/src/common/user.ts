import { UserBasicDto } from "@/api.ts";
import { useHoFetch } from "@/hooks/http.ts";
import { useAsync } from "@/hooks/async.ts";
import { useEffect, useMemo } from "react";

export type UserProfileBasic = UserBasicDto & {
  userIdStr: string;
};
let user: Promise<UserProfileBasic> | UserProfileBasic | undefined;
const userEvent = new EventTarget();

export function useCurrentUser(option: { manual?: boolean } = {}) {
  const { manual } = option;
  const { api } = useHoFetch();
  const { result, run, reset } = useAsync(
    (force?: boolean) => {
      if (!user || force) {
        user = api["/user/basic_info"].get().then((res) => ({ ...res, userIdStr: res.user_id.toString().padStart(6) }));
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
      refresh: () => run(true).then(() => userEvent.dispatchEvent(new Event("refresh"))),
    };
  }, [result]);
}
