import { AdaptiveMenuLayout } from "@/routes/-layout/AdaptiveMenuLayout.tsx";
import { createLazyFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/_school/examination")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <AdaptiveMenuLayout items={[{ label: "我的考试", key: "my-exams" }]}>
      <Outlet />
    </AdaptiveMenuLayout>
  );
}
