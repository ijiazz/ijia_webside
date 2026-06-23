import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_school/examination/")({
  beforeLoad(ctx) {
    throw redirect({ to: "/examination/self" });
  },
});
