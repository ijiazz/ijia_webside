import { css } from "@emotion/css";
import { createLazyFileRoute, useLoaderData } from "@tanstack/react-router";
import { Button } from "antd";
import { UserQuestionList } from "./-components/UserQuestionList.tsx";
import { getLoginURL } from "@/common/host.ts";

export const Route = createLazyFileRoute("/_school/examination/self-question/")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = Route.useNavigate();
  const { userInfo } = useLoaderData({ from: "/_school" });
  if (!userInfo) {
    throw navigate({ href: getLoginURL(), replace: true });
  }
  return (
    <div className={PageCSS}>
      <Button type="primary" aria-label="发布题目" onClick={() => navigate({ to: "/question/create" })}>
        发布题目
      </Button>
      <UserQuestionList userId={userInfo.user_id} canManage />
    </div>
  );
}

const PageCSS = css`
  box-sizing: border-box;
  position: relative;
  max-width: 650px;
  min-width: 300px;
  height: 100%;
  margin: 0 auto;
  padding: 24px 12px 4px;
  overflow: auto;

  @media screen and (max-width: 400px) {
    padding: 12px 6px;
  }
`;
