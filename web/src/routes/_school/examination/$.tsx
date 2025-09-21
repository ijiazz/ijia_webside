import { Developing } from "@/common/page_state/Developing.tsx";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_school/examination/$")({
  component: Developing,
});
