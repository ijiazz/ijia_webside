import { createLazyFileRoute, useLoaderData } from "@tanstack/react-router";
import { UserQuestionList } from "./-components/UserQuestionList.tsx";
import { Button } from "antd";
import { css, cx } from "@emotion/css";

export const Route = createLazyFileRoute("/_school/user/$userId/question/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { userInfo: currentUser } = useLoaderData({ from: "/_school" });
  const navigate = Route.useNavigate();
  const { userId } = Route.useParams({
    select(params) {
      return {
        userId: Number.parseInt(params.userId),
      };
    },
  });
  const isSelf = !!currentUser && currentUser.user_id === userId;

  return (
    <div className={cx(HomePageCSS, PostListCSS)}>
      <Button type="primary" size="large" onClick={() => navigate({ to: "/question/create" })} disabled={!isSelf}>
        发布题目
      </Button>
      <UserQuestionList canManage={isSelf} userId={userId} />
    </div>
  );
}
const HomePageCSS = css`
  box-sizing: border-box;
  padding: 0 12px 4px 12px;
  @media screen and (max-width: 400px) {
    padding: 0 6px 12px 6px;
  }
`;
const PostListCSS = css`
  position: relative;
  max-width: 650px;
  min-width: 300px;
  margin: 0 auto;

  height: 100%;
  overflow: auto;
`;
