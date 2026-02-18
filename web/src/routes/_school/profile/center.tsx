import { queryClient } from "@/request/client.ts";
import { CurrentUserProfileQueryOption, getCurrentUserInfoQueryOption } from "@/request/user.ts";
import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/_school/profile/center")({
  async loader() {
    await Promise.all([
      queryClient.ensureQueryData(CurrentUserProfileQueryOption),
      queryClient.ensureQueryData(getCurrentUserInfoQueryOption()),
    ]);
  },
});
