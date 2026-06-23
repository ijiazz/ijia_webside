import { AdaptiveMenuLayout, AdaptiveMenuLayoutProps } from "@/routes/-layout/AdaptiveMenuLayout.tsx";
import { createLazyFileRoute, Outlet, type RouteTypes } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/_school/examination")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <AdaptiveMenuLayout items={items} style={{ height: "100%" }}>
      <Outlet />
    </AdaptiveMenuLayout>
  );
}
const items: AdaptiveMenuLayoutProps["items"] = [
  {
    label: "我的考试",
    key: "my-exams",
  },
];
