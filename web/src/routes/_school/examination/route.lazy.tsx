import { AdaptiveMenuLayout, AdaptiveMenuLayoutProps } from "@/routes/-layout/AdaptiveMenuLayout.tsx";
import { createLazyFileRoute, Outlet, useLoaderData, useLocation, useNavigate } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/_school/examination")({
  component: RouteComponent,
});

function RouteComponent() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { userInfo } = useLoaderData({ from: "/_school" });
  const items: AdaptiveMenuLayoutProps["items"] = [
    {
      label: "题库",
      key: "/examination/question-bank",
    },
  ];
  if (userInfo) {
    items.push({
      label: "我的考试",
      key: "/examination/self",
    });
  }

  return (
    <AdaptiveMenuLayout
      items={items}
      style={{ height: "100%" }}
      selectedKeys={[pathname]}
      onSelect={(item) => {
        navigate({ to: item.key });
      }}
    >
      <Outlet />
    </AdaptiveMenuLayout>
  );
}
