import { ExamQuestionType } from "@/api.ts";
import { FormItem, getAntdErrorStatus } from "@/components/form.tsx";
import { DatePicker, Input, Radio } from "antd";
import { Controller, useFormContext } from "react-hook-form";
import { AttachmentsField } from "./OptionsField/AttachmentsField.tsx";
import { OptionsField } from "./OptionsField/OptionsField.tsx";
import {
  EditQuestionFormFields,
  QuestionEditMode,
  FormModeContext,
  EditQuestionFormInput,
} from "./OptionsField/form.ts";

export { type EditQuestionFormFields, QuestionEditMode } from "./OptionsField/form.ts";

export type EditQuestionFieldsProps = {
  mode?: QuestionEditMode;
  readonlyQuestionType?: boolean;
};

export function EditQuestionFields(props: EditQuestionFieldsProps) {
  const { mode = QuestionEditMode.Edit, readonlyQuestionType = false } = props;
  const form = useFormContext<EditQuestionFormInput, undefined, EditQuestionFormFields>();

  return (
    <>
      <Controller
        name="question_type"
        render={({ field, fieldState }) => {
          const isReadonly = mode === QuestionEditMode.Edit || readonlyQuestionType;
          return (
            <FormItem label="题型" error={fieldState.error?.message}>
              <Radio.Group
                {...field}
                aria-label="题型"
                onChange={(e) => {
                  if (isReadonly) return;
                  const type = e.target.value as ExamQuestionType;
                  switch (type) {
                    case ExamQuestionType.SingleChoice:
                      form.setValue("options", [{}, {}, {}, {}]);
                      break;
                    case ExamQuestionType.MultipleChoice:
                      form.setValue("options", [{}, {}, {}, {}]);
                      break;
                    case ExamQuestionType.TrueOrFalse:
                      form.setValue("options", undefined);
                      break;
                    default:
                      break;
                  }
                  form.setValue("answer_index", []);
                  field.onChange(type);
                }}
                style={{
                  cursor: isReadonly ? "default" : undefined,
                  pointerEvents: isReadonly ? "none" : undefined,
                }}
                optionType="button"
                buttonStyle="solid"
                aria-readonly={isReadonly}
              >
                <Radio.Button value={ExamQuestionType.SingleChoice}>单选</Radio.Button>
                <Radio.Button value={ExamQuestionType.MultipleChoice}>多选</Radio.Button>
                <Radio.Button value={ExamQuestionType.TrueOrFalse}>判断</Radio.Button>
              </Radio.Group>
            </FormItem>
          );
        }}
      />
      <Controller
        name="question_text"
        rules={{
          required: "请输入题目",
        }}
        render={({ field, fieldState }) => (
          <FormItem required label="题目" error={fieldState.error?.message}>
            <Input.TextArea
              {...field}
              aria-label="题目内容"
              autoSize={{ minRows: 3, maxRows: 8 }}
              status={getAntdErrorStatus(fieldState)}
            />
          </FormItem>
        )}
      />
      <AttachmentsField />
      <FormModeContext value={mode}>
        <OptionsField />
      </FormModeContext>
      <Controller
        name="explanation_text"
        rules={{
          required: "请输入答案解析",
        }}
        render={({ field, fieldState }) => (
          <FormItem required label="答案解析" error={fieldState.error?.message} description="可以添加抖音或外站链接">
            <Input.TextArea
              {...field}
              aria-label="答案解析"
              autoSize={{ minRows: 3, maxRows: 8 }}
              status={getAntdErrorStatus(fieldState)}
            />
          </FormItem>
        )}
      />
      <Controller
        name="event_time"
        render={({ field, fieldState }) => (
          <FormItem label="事件时间" error={fieldState.error?.message} description="题目相关事件的发生时间">
            <DatePicker {...field} value={field.value ?? ""} />
          </FormItem>
        )}
      />
    </>
  );
}
