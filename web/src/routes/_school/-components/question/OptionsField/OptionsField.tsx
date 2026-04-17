import { ExamQuestionType } from "@/api.ts";
import { FormItem, getAntdErrorStatus } from "@/components/form.tsx";
import { DeleteOutlined } from "@ant-design/icons";
import { Button, Checkbox, Input, Radio, Tag } from "antd";
import { Controller, useController, useFieldArray, useWatch } from "react-hook-form";
import { EditQuestionFormFields } from "./form.ts";

export function OptionsField() {
  const questionType = useWatch<EditQuestionFormFields, "question_type">({ name: "question_type" });
  switch (questionType) {
    case ExamQuestionType.SingleChoice:
      return <SingleOptions />;
    case ExamQuestionType.MultipleChoice:
      return <MultipleOptions />;
    case ExamQuestionType.TrueOrFalse:
      return <TrueFalseOptions />;
    default:
      break;
  }
}
function MultipleOptions() {
  const answerIndexField = useController<EditQuestionFormFields, "answer_index">({
    name: "answer_index",
  });

  const { fields, append, remove } = useFieldArray<EditQuestionFormFields>({
    name: "options",
  });
  const maxOptionCount = 6,
    minOptionCount = 3;

  return (
    <FormItem
      label="选项"
      required
      description="无需考虑选项顺序，考试系统会自动随机打乱选项顺序"
      error={answerIndexField.fieldState.error?.message}
    >
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
        {fields.map((field, index) => (
          <div key={field.id} style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Tag>{String.fromCharCode(65 + index)}</Tag>
            <Checkbox
              value={index}
              checked={answerIndexField.field.value.includes(index)}
              onChange={() => {
                const current = answerIndexField.field.value || [];
                if (current.includes(index)) {
                  answerIndexField.field.onChange(current.filter((i) => i !== index));
                } else {
                  answerIndexField.field.onChange([...current, index]);
                }
              }}
            />
            <Controller
              name={`options.${index}.value` as const}
              render={({ field, fieldState }) => (
                <Input {...field} status={getAntdErrorStatus(fieldState)} placeholder={`选项 ${index + 1}`} />
              )}
            />
            <Button
              danger
              disabled={fields.length <= minOptionCount}
              type="text"
              icon={<DeleteOutlined />}
              onClick={() => remove(index)}
            />
          </div>
        ))}
        {fields.length < maxOptionCount && (
          <Button onClick={() => append({})} type="default" disabled={fields.length >= maxOptionCount}>
            添加选项
          </Button>
        )}
      </div>
    </FormItem>
  );
}
function SingleOptions() {
  const answerIndexField = useController<EditQuestionFormFields, "answer_index">({
    name: "answer_index",
  });

  const { fields, append, remove } = useFieldArray<EditQuestionFormFields, "options">({
    name: "options",
  });
  const maxOptionCount = 6,
    minOptionCount = 2;

  return (
    <FormItem
      label="选项"
      required
      error={answerIndexField.fieldState.error?.message}
      description="无需考虑选项顺序，考试系统会自动随机打乱选项顺序"
    >
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
        {fields.map((field, index) => (
          <div key={field.id} style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Tag>{String.fromCharCode(65 + index)}</Tag>
            <Radio
              value={index}
              checked={answerIndexField.field.value?.[0] === index}
              onChange={() => {
                answerIndexField.field.onChange([index]);
              }}
            />
            <Controller
              name={`options.${index}.value` as const}
              render={({ field, fieldState }) => (
                <Input {...field} status={getAntdErrorStatus(fieldState)} placeholder={`选项 ${index + 1}`} />
              )}
            />
            <Button
              danger
              disabled={fields.length <= minOptionCount}
              type="text"
              icon={<DeleteOutlined />}
              onClick={() => remove(index)}
            />
          </div>
        ))}
        {fields.length < maxOptionCount && (
          <Button onClick={() => append({})} type="default" disabled={fields.length >= maxOptionCount}>
            添加选项
          </Button>
        )}
      </div>
    </FormItem>
  );
}
function TrueFalseOptions() {
  const answerIndexField = useController<EditQuestionFormFields, "answer_index">({
    name: "answer_index",
  });
  const radioValue =
    answerIndexField.field.value?.[0] === 0 ? true : answerIndexField.field.value?.[0] === 1 ? false : undefined;
  return (
    <FormItem label="答案" required error={answerIndexField.fieldState.error?.message}>
      <div style={{ width: "100%", display: "flex", gap: 8 }}>
        <Radio.Group value={radioValue} onChange={(e) => answerIndexField.field.onChange([e.target.value ? 0 : 1])}>
          <Radio value={true}>✅ 正确</Radio>
          <Radio value={false}>❌ 错误</Radio>
        </Radio.Group>
      </div>
    </FormItem>
  );
}
