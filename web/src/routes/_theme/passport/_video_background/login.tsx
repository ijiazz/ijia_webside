import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_theme/passport/_video_background/login")({
  validateSearch(value): { redirect?: string } {
    return value;
  },
});
