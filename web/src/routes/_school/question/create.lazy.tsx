import { createLazyFileRoute } from "@tanstack/react-router";
import { EditQuestionFields, EditQuestionFormFields } from "../-components/question/EditQuestionFields.tsx";
import { FormProvider, useForm } from "react-hook-form";
import { ExamQuestionType } from "@/api.ts";

export const Route = createLazyFileRoute("/_school/question/create")({
  component: RouteComponent,
});

type FromValues = EditQuestionFormFields;

function RouteComponent() {
  const form = useForm<FromValues>({
    defaultValues: {
      options: [{}, {}, {}, {}],
    },
  });
  return (
    <div
      style={{
        padding: "12px 16px",
        maxWidth: 500,
        margin: "0 auto",
      }}
    >
      <FormProvider {...form}>
        <EditQuestionFields mode="create" />
      </FormProvider>
    </div>
  );
}
