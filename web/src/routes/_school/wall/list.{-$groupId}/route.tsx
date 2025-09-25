import { createFileRoute } from "@tanstack/react-router";
import { api } from "@/common/http.ts";

export const Route = createFileRoute("/_school/wall/list/{-$groupId}")({
  loader(ctx) {
    return api["/post/group/list"].get().catch(() => undefined);
  },
  shouldReload: (ctx) => ctx.cause === "enter",
});
