import { EditQuestionFields, QuestionEditMode } from "@/routes/_school/-components/question/EditQuestionFields.tsx";
import { FormProvider, UseFormReturn } from "react-hook-form";
import { css } from "@emotion/css";
import { FromValues } from "./CreateForm.tsx";
import { CratePreview } from "./CreatePreview.tsx";

export type QuestionFormProps = {
  form: UseFormReturn<FromValues>;
  onSubmit: () => void;
  footer?: React.ReactNode;
};
export function QuestionForm(props: QuestionFormProps) {
  const { form, onSubmit, footer } = props;

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
        {footer}
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
