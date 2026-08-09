import { getGlobalQuestionStatQueryOption } from "@/request/question.ts";
import { css } from "@emotion/css";
import { useQuery } from "@tanstack/react-query";
import { createLazyFileRoute } from "@tanstack/react-router";
import { Card, Space, Statistic } from "antd";
export const Route = createLazyFileRoute("/_school/examination/question-bank")({
  component: RouteComponent,
});

function RouteComponent() {
  const { data: stat } = useQuery(getGlobalQuestionStatQueryOption());
  return (
    <div className={PageCSS}>
      <Card>
        <Space size="large" wrap>
          <Statistic title="题库可用题目数" value={stat?.passed_count} />
          <Statistic title="审核中的题目数" value={stat?.reviewing_count} />
        </Space>
      </Card>
    </div>
  );
}

const PageCSS = css`
  max-width: 750px;
  margin: 0 auto;
  padding: 24px 16px;
  box-sizing: border-box;
  @media (max-width: 768px) {
    padding: 4px 12px;
  }
`;
