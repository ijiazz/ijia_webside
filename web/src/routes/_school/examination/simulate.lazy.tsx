import { createExamination } from "@/request/examination.ts";
import { css } from "@emotion/css";
import { createLazyFileRoute, Link } from "@tanstack/react-router";
import { Button, Card, Space, Statistic, Typography } from "antd";
import { useMessage } from "@/provider/AntdProvider.tsx";
import { FormProvider, useForm } from "react-hook-form";
import { ExaminationCreateByNewTemplate } from "@ijia/api-types";
import { OptionFormItems } from "./-components/simulate/OptionForm.tsx";
import { QuestionRule } from "./-components/simulate/QuestionRule.tsx";

export const Route = createLazyFileRoute("/_school/examination/simulate")({
  component: RouteComponent,
});

const MAX_QUESTION_COUNT = 65535;

type FormValues = ExaminationCreateByNewTemplate;

function RouteComponent() {
  const navigate = Route.useNavigate();
  const { stat } = Route.useLoaderData();
  const form = useForm<FormValues>({
    defaultValues: {
      paperTemplate: {
        questions: {
          number: 50,
          score: 2,
        },
      },
    },
  });
  const message = useMessage();
  const { isSubmitting } = form.formState;
  const handleSubmit = form.handleSubmit(async (values) => {
    const result = await createExamination(values);
    message.success("模拟考试已创建");
    navigate({ to: `/examination/$examId`, params: { examId: result.examination_id }, replace: true });
  });
  return (
    <div className={PageCSS}>
      <Card>
        <Space size="large" wrap>
          <Statistic title="题库可用题目数" value={stat.passed_count} />
          <Statistic title="审核中的题目数" value={stat.reviewing_count} />
        </Space>
      </Card>
      <Card>
        <div style={{ marginBottom: 16 }}>
          <Typography.Title level={4} style={{ marginBottom: 4 }}>
            创建考试
          </Typography.Title>
          <Typography.Text type="secondary">
            创建模拟考试，一部分题目会从已审核通过的题目随机抽取题目，另一部分会通过机器生成随机题目。
          </Typography.Text>
        </div>
        <FormProvider {...form}>
          <form onSubmit={handleSubmit} className={GrowFlexCSS} style={{ flexDirection: "column" }}>
            <div className={GrowFlexCSS} style={{ gap: 14 }}>
              <QuestionRule maxQuestionCount={MAX_QUESTION_COUNT} prefix="paperTemplate.questions." />
            </div>
            {!import.meta.env.PROD && <OptionFormItems />}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 24, alignItems: "center" }}>
              <Link to="/examination">
                <Button>返回考试列表</Button>
              </Link>
              <Button type="primary" htmlType="submit" loading={isSubmitting}>
                创建
              </Button>
            </div>
          </form>
        </FormProvider>
      </Card>
    </div>
  );
}
const GrowFlexCSS = css`
  display: flex;
  > * {
    flex-grow: 1;
  }
`;
const PageCSS = css`
  max-width: 750px;
  margin: 0 auto;
  padding: 24px 16px;
  box-sizing: border-box;
  @media (max-width: 768px) {
    padding: 4px 12px;
  }
`;
