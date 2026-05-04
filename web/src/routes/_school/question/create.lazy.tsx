import { createLazyFileRoute, useRouter } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { ExamQuestionType } from "@/api.ts";
import { Button, Space } from "antd";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/request/client.ts";
import { FromValues } from "./-components/CreateForm.tsx";
import { QuestionForm } from "./-components/QuestionForm.tsx";

export const Route = createLazyFileRoute("/_school/question/create")({
  component: RouteComponent,
});

function RouteComponent() {
  const router = useRouter();
  const form = useForm<FromValues>({
    defaultValues: {
      question_type: ExamQuestionType.SingleChoice,
      options: [{}, {}, {}, {}],
    },
  });
  const { isSubmitting } = form.formState;
  const ogBack = () => {
    if (router.history.canGoBack()) {
      router.history.back();
    } else {
      router.navigate({ to: "/user" });
    }
  };
  const { mutateAsync } = useMutation({
    mutationFn: (data: FromValues) => api["/question/entity"].put({ body: data }),
    onSuccess: () => {
      form.reset();
      ogBack();
    },
  });
  const onSubmit = form.handleSubmit(async (values) => {
    await mutateAsync(values);
  });

  return (
    <div style={{ minHeight: "100%" }} e2e-question-form="create">
      <QuestionForm
        form={form}
        onSubmit={onSubmit}
        footer={
          <Space>
            <Button aria-label="返回题目列表" onClick={ogBack}>
              返回
            </Button>
            <Button aria-label="创建题目" type="primary" onClick={onSubmit} loading={isSubmitting}>
              创建
            </Button>
          </Space>
        }
      />
    </div>
  );
}
