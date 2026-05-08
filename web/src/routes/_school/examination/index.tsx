import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_school/examination/")({
  beforeLoad: async () => {
    throw redirect({ to: "/examination/simulate" });
  },
});
