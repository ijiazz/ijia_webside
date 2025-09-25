import { createFileRoute } from "@tanstack/react-router";
import { api } from "@/common/http.ts";
import { HomePageRes } from "@/api.ts";

export const Route = createFileRoute("/(home)/")({
  loader(ctx): Promise<HomePageRes | undefined> {
    return api["/live/screen/home"].get().catch((res) => undefined);
  },
  staleTime: 1000 * 60 * 10,
  shouldReload: (ctx) => ctx.cause === "enter",
});
