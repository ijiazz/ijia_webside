import { ExamQuestionType, QuestionPrivate } from "@/api.ts";
import { QUESTION_TYPE_LABEL } from "./const.ts";
import { OptionsBoard } from "./OptionsBoard/OptionsBoard.tsx";
import { QuestionAttachments } from "./OptionsBoard/QuestionAttachments.tsx";
import { Card, CardProps, Space, Tag, Typography } from "antd";

export type QuestionWorkData = Partial<QuestionPrivate>;

export type QuestionWorkProps = Omit<CardProps, "title" | "styles" | "onChange"> & {
  data: QuestionWorkData;
  correctIndexes?: number[];
  value?: number[];
  onChange?: (indexes: number[]) => void;

  children?: React.ReactNode;
};
export function QuestionWork(props: QuestionWorkProps) {
  const { data, value, onChange, correctIndexes, children, ...rest } = props;
  if (!data.question_type) {
    return <div>请选择题型</div>;
  }
  return (
    <Card
      {...rest}
      title={
        <Space>
          {data.index !== undefined && <span>{data.index + 1}.</span>}
          <Tag color="geekblue">{QUESTION_TYPE_LABEL[data.question_type]}</Tag>
          <Typography.Text strong>{data.question_text}</Typography.Text>
        </Space>
      }
      styles={{
        body: {
          paddingBlockStart: 0,
        },
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {data.attachments && data.attachments.length > 0 && <QuestionAttachments data={data.attachments} />}
        {data.options && data.options.length > 0 && (
          <OptionsBoard
            type={data.question_type}
            data={data.options}
            correctIndexes={correctIndexes}
            value={value}
            onChange={onChange}
          />
        )}
        {value && value.length > 0 && (
          <div>
            <div>
              你的答案：
              {toAnswer(value, data.question_type)}
            </div>
            {correctIndexes && (
              <div>
                正确答案：
                {toAnswer(correctIndexes, data.question_type)}
              </div>
            )}
          </div>
        )}
      </div>
      {children}
    </Card>
  );
}

function toAnswer(indexes: number[], type: ExamQuestionType) {
  if (type === ExamQuestionType.TrueOrFalse) {
    return indexes[0] === 0 ? "❌" : "✅";
  }
  return indexes
    .sort((a, b) => a - b)
    .map((index) => String.fromCharCode(65 + index))
    .join(", ");
}
