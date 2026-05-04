import { useRouter, createLazyFileRoute } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { Button, Space } from "antd";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/request/client.ts";
import { FromValues } from "./-components/CreateForm.tsx";
import { QuestionForm } from "./-components/QuestionForm.tsx";
import { UpdateQuestionParam } from "@/api.ts";
import { pruneDirty } from "@/components/form/formValues.ts";

export const Route = createLazyFileRoute("/_school/question/edit/$questionId")({
  component: RouteComponent,
});

function RouteComponent() {
  const router = useRouter();
  const { question } = Route.useLoaderData();
  const form = useForm<FromValues>({
    defaultValues: question,
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
    mutationFn: ({ body, questionId }: { body: UpdateQuestionParam; questionId: string }) => {
      return api["/question/entity/:question_id"].patch({ params: { question_id: questionId }, body });
    },
    onSuccess: () => {
      ogBack();
    },
  });
  const onSubmit = form.handleSubmit(async (values) => {
    const params = pruneDirty(values, form.formState.dirtyFields) ?? {};
    await mutateAsync({ body: params, questionId: question.question_id });
  });

  return (
    <div style={{ minHeight: "100%" }}>
      <QuestionForm
        form={form}
        onSubmit={onSubmit}
        footer={
          <Space>
            <Button onClick={ogBack}>返回</Button>
            <Button type="primary" onClick={onSubmit} loading={isSubmitting}>
              创建
            </Button>
          </Space>
        }
      />
    </div>
  );
}
