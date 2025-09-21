import { createFileRoute } from "@tanstack/react-router";
import { api } from "@/common/http.ts";
import { lazyComponent } from "@/lib/lazy_component.tsx";

const Page = lazyComponent(() => import("../-components/VideoBg.tsx").then((mod) => mod.VideoBg));

export const Route = createFileRoute("/passport/_video_background")({
  async loader(ctx) {
    return api["/passport/config"].get().catch(() => ({}));
  },
  component: Page,
});
