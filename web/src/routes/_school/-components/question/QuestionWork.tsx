import { ExamQuestionType, QuestionPrivate } from "@/api.ts";
import { QUESTION_TYPE_LABEL } from "./const.ts";
import { OptionsBoard } from "./OptionsBoard/OptionsBoard.tsx";
import { QuestionAttachments } from "./OptionsBoard/QuestionAttachments.tsx";
import { Card, CardProps, Space, Tag, Typography } from "antd";
import { formatTimeToString } from "@/common/time.ts";

export type QuestionWorkData = Partial<QuestionPrivate>;

export type QuestionWorkProps = Omit<CardProps, "title" | "styles" | "onChange"> & {
  data: QuestionWorkData;
  /** 正确答案选项索引 */
  correctIndexes?: number[];
  /** 当前选择的选项索引 */
  value?: number[] | null;
  /** 题号 */
  index?: number;
  /** 选择选项时触发 */
  onChange?: (indexes: number[]) => void;
  readOnly?: boolean;
  children?: React.ReactNode;
};
export function QuestionWork(props: QuestionWorkProps) {
  const { data, index, value, onChange, correctIndexes, children, readOnly, ...rest } = props;

  if (!data.question_type) {
    return (
      <Typography.Text {...rest} type="secondary">
        题目不存在
      </Typography.Text>
    );
  }
  return (
    <Card
      {...rest}
      title={
        <Space>
          <span>
            {index !== undefined && <span>{index + 1}.</span>}
            {typeof data.score_total === "number" && (
              <Typography.Text type="secondary">【{data.score_total}分】</Typography.Text>
            )}
            {data.question_type && <Tag color="geekblue">{QUESTION_TYPE_LABEL[data.question_type]}</Tag>}
          </span>
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
            value={value ?? undefined}
            onChange={onChange}
            readOnly={readOnly}
          />
        )}
        {children}
      </div>
    </Card>
  );
}
export type QuestionAnswerProps = {
  /** 正确答案选项索引 */
  correctIndexes?: number[];
  /** 当前选择的选项索引 */
  selected?: number[] | null;
  /** 题目做题用时。单位毫秒 */
  useTime?: number | null;
  /** 做题是否超时 */
  isTimeout?: boolean;
  /** 得分 */
  score?: number | null;
  questionType?: ExamQuestionType;
};
export function QuestionAnswer(props: QuestionAnswerProps) {
  const { selected, correctIndexes, useTime, isTimeout, score, questionType } = props;
  return (
    <div>
      {selected && selected.length > 0 && (
        <div style={{ display: "flex", gap: 16 }}>
          <div style={{ marginRight: 24 }}>
            你的答案：
            {questionType && toAnswer(selected, questionType)}
          </div>
          {typeof score === "number" && (
            <Typography.Text type={score === 0 ? "danger" : "success"}>得分：{score}</Typography.Text>
          )}
          {typeof useTime === "number" && (
            <Typography.Text type="secondary">用时：{formatTimeToString(useTime, "ms")}</Typography.Text>
          )}
          {isTimeout && <Tag color="red">超时</Tag>}
        </div>
      )}
      {correctIndexes && (
        <div>
          正确答案：
          {questionType && toAnswer(correctIndexes, questionType)}
        </div>
      )}
    </div>
  );
}

function toAnswer(indexes: number[], type: ExamQuestionType) {
  if (type === ExamQuestionType.TrueOrFalse) {
    return indexes[0] === 0 ? "❌" : "✅";
  }
  return indexes
    .toSorted((a, b) => a - b)
    .map((index) => String.fromCharCode(65 + index))
    .join(", ");
}
