import { ReviewTargetType } from "@ijia/api-types";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_school/review/")({
  beforeLoad(ctx) {
    throw redirect({ to: "./$type", params: { type: ReviewTargetType.post } });
  },
});
