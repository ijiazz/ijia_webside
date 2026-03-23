import { ExamQuestionType, QuestionAttachment, QuestionOption } from "@/api.ts";
import { FormItem, getAntdErrorStatus } from "@/components/form.tsx";
import { DeleteOutlined } from "@ant-design/icons";
import { Button, Input, Radio, Tag } from "antd";
import { Controller, useController, useFieldArray, useWatch } from "react-hook-form";

export type EditQuestionFormFields = {
  question_text: string;
  // question_text_struct?: TextStructure[] | null;

  explanation_text: string;
  // explanation_text_struct?: TextStructure[] | null;

  answer_index: number[];

  /** 事件时间 */
  event_time?: string;

  /** 题目类型 */
  question_type: ExamQuestionType;
  attachments?: QuestionAttachment[];
  options?: QuestionOption[];
};

export type EditQuestionFieldsProps = {
  mode: "create" | "edit";
};

export function EditQuestionFields(props: EditQuestionFieldsProps) {
  const { mode = "edit" } = props;
  return (
    <>
      <Controller
        name="question_type"
        render={({ field, fieldState }) => (
          <FormItem label="题型" error={fieldState.error?.message}>
            <Radio.Group {...field} optionType="button" buttonStyle="solid">
              <Radio.Button value={ExamQuestionType.SingleChoice}>单选</Radio.Button>
              <Radio.Button value={ExamQuestionType.MultipleChoice}>多选</Radio.Button>
              <Radio.Button value={ExamQuestionType.TrueOrFalse}>判断</Radio.Button>
            </Radio.Group>
          </FormItem>
        )}
      />
      <Controller
        name="question_text"
        render={({ field, fieldState }) => (
          <FormItem label="题目" error={fieldState.error?.message}>
            <Input.TextArea {...field} autoSize={{ minRows: 3, maxRows: 8 }} status={getAntdErrorStatus(fieldState)} />
          </FormItem>
        )}
      />
      <QuestionOptions />
      <Controller
        name="explanation_text"
        render={({ field, fieldState }) => (
          <FormItem label="答案解析" error={fieldState.error?.message}>
            <Input.TextArea {...field} autoSize={{ minRows: 3, maxRows: 8 }} status={getAntdErrorStatus(fieldState)} />
          </FormItem>
        )}
      />
    </>
  );
}

function QuestionOptions() {
  const [questionType] = useWatch<EditQuestionFormFields, ["question_type"]>({
    name: ["question_type"],
  });
  const answerIndexField = useController({
    name: "answer_index",
  });
  const { fields, append, remove, replace } = useFieldArray<EditQuestionFormFields>({
    name: "options" as const,
  });

  return (
    <FormItem label="选项">
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
        {fields.map((field, index) => (
          <div key={field.id} style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Tag>{String.fromCharCode(65 + index)}</Tag>
            <Controller
              name={`options.${index}.value` as const}
              render={({ field, fieldState }) => (
                <Input {...field} status={getAntdErrorStatus(fieldState)} placeholder={`选项 ${index + 1}`} />
              )}
            />
            <Button
              danger
              disabled={fields.length <= 2}
              type="text"
              icon={<DeleteOutlined />}
              onClick={() => remove(index)}
            />
          </div>
        ))}
        <Button onClick={() => append({})} type="default">
          添加选项
        </Button>
      </div>
    </FormItem>
  );
}
