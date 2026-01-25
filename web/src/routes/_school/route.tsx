import { queryClient } from "@/request/client.ts";
import { CurrentUserInfoQueryOption } from "@/request/user.ts";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_school")({
  async loader(ctx) {
    await queryClient.ensureQueryData(CurrentUserInfoQueryOption);
  },
});
