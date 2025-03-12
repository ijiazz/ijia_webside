import { UserProfileDto } from "@/api.ts";
import { useHoFetch } from "@/hooks/http.ts";
import { useAsync } from "@/hooks/async.ts";
import { useMemo } from "react";

export type UserProfileBasic = UserProfileDto & {
  userIdStr: string;
};
let user: Promise<UserProfileBasic> | UserProfileBasic | undefined;

export function useCurrentUser() {
  const { api } = useHoFetch();
  const { result, run } = useAsync(
    (force?: boolean) => {
      if (!user || force)
        user = api["/user/profile"].get().then((res) => ({ ...res, userIdStr: res.user_id.toString().padStart(6) }));
      return user;
    },
    { autoRunArgs: [] },
  );
  return useMemo(() => {
    return {
      ...result,
      refresh: () => run(true),
    };
  }, [result]);
}
