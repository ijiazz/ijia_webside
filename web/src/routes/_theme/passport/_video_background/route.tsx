import { createFileRoute } from "@tanstack/react-router";
import { api } from "@/request/client.ts";
import { lazyComponent } from "@/lib/lazy_component.tsx";

const Page = lazyComponent(() => import("../-components/VideoBg.tsx").then((mod) => mod.VideoBg));

export const Route = createFileRoute("/_theme/passport/_video_background")({
  async loader(ctx) {
    return api["/passport/config"].get().catch(() => ({}));
  },
  shouldReload: (ctx) => ctx.cause === "enter",
  component: Page,
});
