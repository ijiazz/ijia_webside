import { getGlobalQuestionStatQueryOption } from "@/request/question.ts";
import { createExamination } from "@/request/examination.ts";
import { css } from "@emotion/css";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createLazyFileRoute } from "@tanstack/react-router";
import { Alert, Button, Card, Form, InputNumber, Space, Statistic, Typography, message } from "antd";

export const Route = createLazyFileRoute("/_school/examination/simulate")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = Route.useNavigate();
  const { data } = useSuspenseQuery({ ...getGlobalQuestionStatQueryOption(), refetchInterval: 30 * 1000 });
  const [form] = Form.useForm<CreateFormValues>();
  const { mutateAsync, isPending } = useMutation({
    mutationFn: createExamination,
    onSuccess: (result) => {
      message.success("模拟考试已创建");
      navigate({ href: `/examination/${result.examination_id}` });
    },
  });

  const onSubmit = form.submit;
  return (
    <div className={PageCSS}>
      <Card>
        <Space size="large" wrap>
          <Statistic title="题库可用题目数" value={data.passed_count} />
          <Statistic title="审核中的题目数" value={data.reviewing_count} />
        </Space>
      </Card>
      <Card>
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
          <div>
            <Typography.Title level={4} style={{ marginBottom: 4 }}>
              创建模拟考试
            </Typography.Title>
            <Typography.Text type="secondary">
              当前会在开始考试时，从已审核题目中按数量生成本次考试的题目绑定。
            </Typography.Text>
          </div>
          {data.passed_count === 0 && (
            <Alert
              type="warning"
              showIcon
              message="当前没有可用题目"
              description="请先确保题库中存在已审核通过的题目，再创建模拟考试。"
            />
          )}
          <Form<CreateFormValues>
            form={form}
            layout="vertical"
            initialValues={{ question_total: Math.min(Math.max(data.passed_count, 0), 10) || 0 }}
            onFinish={(values) => mutateAsync(values)}
          >
            <Form.Item<CreateFormValues>
              label="题目数量"
              name="question_total"
              rules={[
                { required: true, message: "请输入题目数量" },
                { type: "number", min: 0, message: "题目数量不能小于 0" },
              ]}
              extra={`当前题库可用题目数：${data.passed_count}`}
            >
              <InputNumber min={0} max={Math.max(data.passed_count, 0)} precision={0} style={{ width: "100%" }} />
            </Form.Item>
            <Space>
              <Button type="primary" onClick={onSubmit} loading={isPending} disabled={data.passed_count === 0}>
                创建并进入考试
              </Button>
              <Button onClick={() => navigate({ to: "/examination" })}>返回考试列表</Button>
            </Space>
          </Form>
        </Space>
      </Card>
    </div>
  );
}

type CreateFormValues = {
  question_total: number;
};
const PageCSS = css`
  max-width: 800px;
  margin: 0 auto;
  padding: 24px 16px;
  box-sizing: border-box;
  @media (max-width: 768px) {
    padding: 4px 12px;
  }
`;
