import { User } from "@/api.ts";
import { queryClient } from "@/request/client.ts";
import { getCurrentUserInfoQueryOption } from "@/request/user.ts";
import { createFileRoute, notFound, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_school/user/")({
  async beforeLoad(ctx) {
    let user: User;
    try {
      user = await queryClient.ensureQueryData(getCurrentUserInfoQueryOption());
    } catch (error) {
      throw notFound();
    }
    throw redirect({ to: `/user/$userId/post`, params: { userId: user.user_id.toString() } });
  },
});
