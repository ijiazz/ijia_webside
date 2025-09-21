import { createFileRoute } from "@tanstack/react-router";
import { api } from "@/common/http.ts";

export const Route = createFileRoute("/_school/wall/list")({
  loader(ctx) {
    return api["/post/group/list"].get().catch(() => undefined);
  },
});
