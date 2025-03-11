import { UserProfileDto } from "@/api.ts";
import { useHoFetch } from "@/hooks/http.ts";
import { useAsync } from "@/hooks/async.ts";
import { useEffect } from "react";
export type UserProfileBasic = UserProfileDto & {
  userIdStr: string;
};
let user: Promise<UserProfileBasic> | UserProfileBasic | undefined;

export function useCurrentUser() {
  const { api } = useHoFetch();
  const { result, run } = useAsync(() => {
    if (!user) user = api["/user/profile"].get().then((res) => ({ ...res, userIdStr: res.user_id.toString() }));
    return user;
  });
  useEffect(() => {
    run();
  }, []);
  return result;
}
