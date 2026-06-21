import { createLazyFileRoute } from "@tanstack/react-router";
import { ExaminationList, ExaminationListPageCSS } from "./-components/ExaminationList.tsx";

export const Route = createLazyFileRoute("/_school/examination/")({
  component: RouteComponent,
});

export function RouteComponent() {
  return <ExaminationList className={ExaminationListPageCSS} showCreateButton={false} />;
}
