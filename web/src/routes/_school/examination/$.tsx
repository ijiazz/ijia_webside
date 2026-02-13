import { Developing } from "@/components/page_state.tsx";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_school/examination/$")({
  component: Developing,
});
