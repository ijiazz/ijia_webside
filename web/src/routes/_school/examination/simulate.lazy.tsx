import { getGlobalQuestionStatQueryOption } from "@/request/question.ts";
import { css } from "@emotion/css";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createLazyFileRoute } from "@tanstack/react-router";
import { Card, Space, Statistic } from "antd";

export const Route = createLazyFileRoute("/_school/examination/simulate")({
  component: RouteComponent,
});

function RouteComponent() {
  const { data } = useSuspenseQuery({ ...getGlobalQuestionStatQueryOption(), refetchInterval: 30 * 1000 });
  return (
    <div className={PageCSS}>
      <Card>
        <Space size="large">
          <Statistic title="审核通过的题库数" value={data.passed_count} />
          <Statistic title="审核中的题目数" value={data.reviewing_count} />
        </Space>
      </Card>
    </div>
  );
}
const PageCSS = css`
  max-width: 800px;
  margin: 0 auto;
  padding: 24px 16px;
  box-sizing: border-box;
  @media (max-width: 768px) {
    padding: 4px 12px;
  }
`;
