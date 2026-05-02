import { ExamQuestionType } from "@/api.ts";
import { FormItem } from "@/components/form.tsx";
import { DeleteOutlined } from "@ant-design/icons";
import { Button, Checkbox, Radio, Tag, Tooltip } from "antd";
import { useController, useFieldArray, useFormState, useWatch } from "react-hook-form";
import { EditQuestionFormInput, QuestionEditMode, FormModeContext } from "./form.ts";
import { Option } from "./Option.tsx";
import { useContext } from "react";

export function OptionsField() {
  const questionType = useWatch<EditQuestionFormInput, "question_type">({ name: "question_type" });
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
  const mode = useContext(FormModeContext);
  const answerIndexField = useController<EditQuestionFormInput, "answer_index">({
    name: "answer_index",
    rules: {
      required: "请选择正确答案",
      validate: (value) => {
        if (!value) return "请选择正确答案";
        if (value.length < 2) return "多选题至少需要选择两个正确答案";
        return true;
      },
    },
  });
  const { defaultValues } = useFormState();
  const { fields, append, remove } = useFieldArray<EditQuestionFormInput>({
    name: "options",
  });
  const maxOptionCount = 6,
    minOptionCount = 3;
  const defaultOptionCount = defaultValues?.options?.length || 0;

  return (
    <FormItem
      label="选项"
      required
      description="无需考虑选项顺序，考试系统会自动随机打乱选项顺序"
      error={answerIndexField.fieldState.error?.message}
    >
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
        {fields.map((field, index) => (
          <div key={field.id} style={{ display: "flex", gap: 8, alignItems: "start" }}>
            <div style={{ marginBlock: 3 }}>
              <Tag>{String.fromCharCode(65 + index)}</Tag>
              <Checkbox
                value={index}
                checked={answerIndexField.field.value?.includes(index)}
                onChange={() => {
                  if (mode !== QuestionEditMode.FullEdit) return;
                  const current = answerIndexField.field.value || [];
                  if (current.includes(index)) {
                    answerIndexField.field.onChange(current.filter((i) => i !== index));
                  } else {
                    answerIndexField.field.onChange([...current, index]);
                  }
                }}
              />
            </div>
            <Option index={index} />

            {(mode === QuestionEditMode.FullEdit || defaultOptionCount > index) && (
              <Tooltip title="删除选项">
                <Button
                  danger
                  disabled={fields.length <= minOptionCount}
                  type="text"
                  icon={<DeleteOutlined />}
                  onClick={() => remove(index)}
                />
              </Tooltip>
            )}
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
  const mode = useContext(FormModeContext);
  const { defaultValues } = useFormState();
  const defaultOptionCount = defaultValues?.options?.length || 0;
  const answerIndexField = useController<EditQuestionFormInput, "answer_index">({
    name: "answer_index",
    rules: { required: "请选择正确答案" },
  });
  const maxOptionCount = 6,
    minOptionCount = 2;

  const { fields, append, remove } = useFieldArray<EditQuestionFormInput, "options">({
    name: "options",
  });

  return (
    <FormItem
      label="选项"
      required
      error={answerIndexField.fieldState.error?.message}
      description="无需考虑选项顺序，考试系统会自动随机打乱选项顺序"
    >
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
        {fields.map((field, index) => (
          <div key={field.id} style={{ display: "flex", gap: 8, alignItems: "start" }}>
            <div style={{ marginBlock: 3 }}>
              <Tag>{String.fromCharCode(65 + index)}</Tag>
              <Radio
                value={index}
                checked={answerIndexField.field.value?.[0] === index}
                onChange={() => {
                  if (mode !== QuestionEditMode.FullEdit) return;
                  answerIndexField.field.onChange([index]);
                }}
                style={{ margin: 0 }}
              />
            </div>
            <Option index={index} />
            {(mode === QuestionEditMode.FullEdit || defaultOptionCount <= index) && (
              <Tooltip title="删除选项">
                <Button
                  danger
                  disabled={fields.length <= minOptionCount}
                  type="text"
                  icon={<DeleteOutlined />}
                  onClick={() => remove(index)}
                />
              </Tooltip>
            )}
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
  const mode = useContext(FormModeContext);
  const answerIndexField = useController<EditQuestionFormInput, "answer_index">({
    name: "answer_index",
  });
  const radioValue =
    answerIndexField.field.value?.[0] === 0 ? true : answerIndexField.field.value?.[0] === 1 ? false : undefined;
  return (
    <FormItem label="答案" required error={answerIndexField.fieldState.error?.message}>
      <div style={{ width: "100%", display: "flex", gap: 8 }}>
        <Radio.Group
          value={radioValue}
          aria-readonly={mode !== QuestionEditMode.FullEdit}
          onChange={(e) => {
            if (mode !== QuestionEditMode.FullEdit) return;
            answerIndexField.field.onChange([e.target.value ? 0 : 1]);
          }}
        >
          <Radio value={true}>✅ 正确</Radio>
          <Radio value={false}>❌ 错误</Radio>
        </Radio.Group>
      </div>
    </FormItem>
  );
}
