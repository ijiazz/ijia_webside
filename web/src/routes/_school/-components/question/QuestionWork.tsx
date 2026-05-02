import { ExamQuestionType, QuestionPrivate } from "@/api.ts";
import { QUESTION_TYPE_LABEL } from "./const.ts";
import { OptionsBoard } from "./OptionsBoard/OptionsBoard.tsx";
import { QuestionAttachments } from "./OptionsBoard/QuestionAttachments.tsx";

export type QuestionWorkData = Partial<QuestionPrivate>;

export type QuestionWorkProps = {
  data: QuestionWorkData;
  correctIndexes?: number[];
  value?: number[];
  onChange?: (indexes: number[]) => void;
};
export function QuestionWork(props: QuestionWorkProps) {
  const { data, value, onChange, correctIndexes } = props;
  if (!data.question_type) {
    return <div>请选择题型</div>;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <h4>
        {data.index}.<i>【{QUESTION_TYPE_LABEL[data.question_type]}】</i>
        {data.question_text}
      </h4>
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
