import { createExamination } from "@/request/examination.ts";
import { css } from "@emotion/css";
import { createLazyFileRoute, Link } from "@tanstack/react-router";
import { Button, Card, InputNumber, Space, Statistic, Typography } from "antd";
import { useMessage } from "@/provider/AntdProvider.tsx";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { FormItem, getAntdErrorStatus } from "@/components/form.tsx";

export const Route = createLazyFileRoute("/_school/examination/simulate")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = Route.useNavigate();
  const { stat } = Route.useLoaderData();
  const form = useForm<CreateFormValues>({});
  const message = useMessage();
  const { isSubmitting } = form.formState;
  const maxQuestionCount = 65535;
  const handleSubmit = form.handleSubmit(async (values) => {
    const result = await createExamination({ question_total: values.question_total });
    message.success("模拟考试已创建");
    navigate({ to: `/examination/$examId`, params: { examId: result.examination_id } });
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
            当前会在开始考试时，从已审核题目中按数量生成本次考试的题目绑定。
          </Typography.Text>
        </div>
        <FormProvider {...form}>
          <form onSubmit={handleSubmit}>
            <Controller
              name="question_total"
              rules={{
                required: "请输入题目数量",
                min: { value: 0, message: "题目数量不能小于 0" },
                max: { value: maxQuestionCount, message: `题目数量不能大于 ${maxQuestionCount}` },
              }}
              render={({ field, fieldState }) => {
                return (
                  <FormItem label="题目数量">
                    <InputNumber
                      {...field}
                      status={getAntdErrorStatus(fieldState)}
                      min={0}
                      max={maxQuestionCount}
                      precision={0}
                      style={{ width: "100%" }}
                    />
                  </FormItem>
                );
              }}
            />
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

type CreateFormValues = {
  question_total: number;
};
const PageCSS = css`
  max-width: 750px;
  margin: 0 auto;
  padding: 24px 16px;
  box-sizing: border-box;
  @media (max-width: 768px) {
    padding: 4px 12px;
  }
`;
