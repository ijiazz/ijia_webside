import { UserProfileDto } from "@/api.ts";
import { useHoFetch } from "@/hooks/http.ts";
import { useAsync } from "@/hooks/async.ts";
import { useEffect, useMemo } from "react";

export type UserProfileBasic = UserProfileDto & {
  userIdStr: string;
};
let user: Promise<UserProfileBasic> | UserProfileBasic | undefined;
const userEvent = new EventTarget();

export function useCurrentUser() {
  const { api } = useHoFetch();
  const { result, run, reset } = useAsync(
    (force?: boolean) => {
      if (!user || force) {
        user = api["/user/profile"].get().then((res) => ({ ...res, userIdStr: res.user_id.toString().padStart(6) }));
      }
      return user;
    },
    { autoRunArgs: [] },
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
