import { UserProfileDto } from "@/api.ts";
import { useHoFetch } from "@/hooks/http.ts";
import { useAsync } from "@/hooks/async.ts";

export type UserProfileBasic = UserProfileDto & {
  userIdStr: string;
  isOfficial?: boolean; //TODO 接口待返回
};
let user: Promise<UserProfileBasic> | UserProfileBasic | undefined;

export function useCurrentUser() {
  const { api } = useHoFetch();
  const { result } = useAsync(
    () => {
      if (!user)
        user = api["/user/profile"].get().then((res) => ({ ...res, userIdStr: res.user_id.toString().padStart(6) }));
      return user;
    },
    { autoRunArgs: [] },
  );
  return result;
}
