import { createLazyFileRoute, useRouter } from "@tanstack/react-router";
import { EditQuestionFields, QuestionEditMode } from "../-components/question/EditQuestionFields.tsx";
import { FormProvider, useForm } from "react-hook-form";
import { ExamQuestionType } from "@/api.ts";
import { css } from "@emotion/css";
import { Button } from "antd";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/request/client.ts";
import { FromValues } from "./-components/CreateForm.tsx";
import { CratePreview } from "./-components/CreatePreview.tsx";

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

  const { mutateAsync } = useMutation({
    mutationFn: (data: FromValues) => api["/question/entity"].put({ body: data }),
    onSuccess: () => {
      form.reset();
      if (router.history.canGoBack()) {
        router.history.back();
      } else {
        router.navigate({ to: "/user" });
      }
    },
  });
  const onSubmit = form.handleSubmit(async (values) => {
    await mutateAsync(values);
  });

  return (
    <div style={{ minHeight: "100%" }}>
      <div className={LayoutCSS}>
        <div style={{ padding: "12px 16px", width: 500 }}>
          <FormProvider {...form}>
            <form onSubmit={onSubmit}>
              <EditQuestionFields mode={QuestionEditMode.FullEdit} />
            </form>
          </FormProvider>
        </div>
        <CratePreview form={form} />
      </div>
      <div
        style={{
          position: "sticky",
          bottom: 0,
          display: "flex",
          justifyContent: "end",
          paddingBlock: 6,
          paddingInline: 16,
        }}
      >
        <Button type="primary" onClick={onSubmit} loading={isSubmitting}>
          创建
        </Button>
      </div>
    </div>
  );
}

const LayoutCSS = css`
  display: flex;
  justify-content: center;
  @media (max-width: 800px) {
    flex-wrap: wrap;
  }
`;
