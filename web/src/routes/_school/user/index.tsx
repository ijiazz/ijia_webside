import { queryClient } from "@/request/client.ts";
import { getCurrentUserInfoQueryOption } from "@/request/user.ts";
import { createFileRoute, notFound, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_school/user/")({
  async beforeLoad(ctx) {
    try {
      const user = await queryClient.ensureQueryData(getCurrentUserInfoQueryOption());
      throw redirect({ to: `./${user.user_id}/post` });
    } catch (error) {
      throw notFound();
    }
  },
});
