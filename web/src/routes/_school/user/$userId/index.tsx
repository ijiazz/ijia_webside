import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_school/user/$userId/")({
  beforeLoad(ctx) {
    throw redirect({ to: `/user/$userId/post`, params: { userId: ctx.params.userId } });
  },
});
