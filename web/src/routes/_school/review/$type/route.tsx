import { AdaptiveMenuLayout } from "@/routes/-layout/AdaptiveMenuLayout.tsx";
import { ReviewTargetType } from "@ijia/api-types";
import { QUESTION_REVIEW_ROUTE_TYPE } from "@/request/question.ts";
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_school/review/$type")({
  component: RouteComponent,
});

function RouteComponent() {
  const { type } = Route.useParams();
  const navigate = Route.useNavigate();
  const menus = [
    { label: "帖子审核", key: ReviewTargetType.post },
    { label: "评论审核", key: ReviewTargetType.post_comment },
    { label: "题目审核", key: QUESTION_REVIEW_ROUTE_TYPE },
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
