import { useRouter, createLazyFileRoute } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { Alert, Button, Space } from "antd";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/request/client.ts";
import { FromValues } from "./-components/CreateForm.tsx";
import { QuestionForm } from "./-components/QuestionForm.tsx";
import { ReviewStatus, UpdateQuestionParam } from "@/api.ts";
import { pruneDirty } from "@/components/form/formValues.ts";
import { QuestionEditMode } from "@/routes/_school/-components/question/EditQuestionFields.tsx";

export const Route = createLazyFileRoute("/_school/question/edit/$questionId")({
  component: RouteComponent,
});

function RouteComponent() {
  const router = useRouter();
  const { question } = Route.useLoaderData();
  const { answer, ...restQuestion } = question;
  const editMode = question.review?.status === ReviewStatus.passed ? QuestionEditMode.Edit : QuestionEditMode.FullEdit;
  const form = useForm<FromValues>({
    defaultValues: {
      ...restQuestion,
      answer_index: answer.answer_index,
      explanation_text: answer.explanation_text,
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
    <div style={{ minHeight: "100%" }} e2e-question-form="edit">
      <QuestionForm
        leftHeader={
          <Alert
            type="warning"
            title="题目审核通过后，不能再更改答案选项，不能删除已存的选项"
            showIcon
            style={{ marginBlock: 8 }}
          />
        }
        form={form}
        mode={editMode}
        readonlyQuestionType
        onSubmit={onSubmit}
        footer={
          <Space>
            <Button aria-label="返回题目列表" onClick={ogBack}>
              返回
            </Button>
            <Button aria-label="保存题目" type="primary" onClick={onSubmit} loading={isSubmitting}>
              保存
            </Button>
          </Space>
        }
      />
    </div>
  );
}
