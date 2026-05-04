import { EditQuestionFields, QuestionEditMode } from "@/routes/_school/-components/question/EditQuestionFields.tsx";
import { FormProvider, UseFormReturn } from "react-hook-form";
import { css } from "@emotion/css";
import { FromValues } from "./CreateForm.tsx";
import { CratePreview } from "./CreatePreview.tsx";
import { Alert } from "antd";

export type QuestionFormProps = {
  form: UseFormReturn<FromValues>;
  onSubmit: () => void;
  footer?: React.ReactNode;
  mode?: QuestionEditMode;
  readonlyQuestionType?: boolean;
  leftHeader?: React.ReactNode;
};
export function QuestionForm(props: QuestionFormProps) {
  const { leftHeader, form, onSubmit, footer, mode = QuestionEditMode.FullEdit, readonlyQuestionType = false } = props;

  return (
    <div style={{ minHeight: "100%" }}>
      <div className={LayoutCSS}>
        <div style={{ padding: "12px 16px", width: 500 }}>
          {leftHeader}
          <FormProvider {...form}>
            <form onSubmit={onSubmit}>
              <EditQuestionFields mode={mode} readonlyQuestionType={readonlyQuestionType} />
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
