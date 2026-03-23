import { AdaptiveMenuLayout } from "@/routes/-layout/AdaptiveMenuLayout.tsx";
import { ReviewTargetType } from "@ijia/api-types";
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_school/review/$type")({
  component: RouteComponent,
});

function RouteComponent() {
  const { type } = Route.useParams();
  const navigate = Route.useNavigate();
  const menus = [
    { label: "帖子", key: ReviewTargetType.post },
    { label: "评论", key: ReviewTargetType.post_comment },
    { label: "题目", key: ReviewTargetType.exam_question },
  ];
  return (
    <AdaptiveMenuLayout
      style={{
        minWidth: "150px",
        height: "100%",
      }}
      items={menus}
      selectedKeys={[type]}
      onClick={(e) => navigate({ to: "../$type", params: { type: e.key } })}
    >
      <Outlet />
    </AdaptiveMenuLayout>
  );
}
