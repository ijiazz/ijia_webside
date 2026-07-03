import { ExamQuestionType, QuestionOption } from "@/api.ts";
import { MultipleOptionsBoard } from "./MultipleOptionsBoard.tsx";
import { SingleOptionsBoard } from "./SingleOptionsBoard.tsx";
import { TrueFalseOptionsBoard } from "./TrueFalseOptionsBoard.tsx";

type OptionsBoardProps = {
  type: ExamQuestionType;
  data: QuestionOption[];
  correctIndexes?: number[]; // 可选，正确选项的索引列表
  value?: number[];
  readOnly?: boolean;
  onChange?: (indexes: number[]) => void;
};

export function OptionsBoard(props: OptionsBoardProps) {
  const { type, data, correctIndexes, onChange, readOnly, value } = props;

  switch (type) {
    case ExamQuestionType.SingleChoice:
      return (
        <SingleOptionsBoard
          readOnly={readOnly}
          data={data}
          correctIndex={correctIndexes?.[0]}
          value={value?.[0]}
          onChange={(value) => onChange?.(value !== undefined ? [value] : [])}
        />
      );
    case ExamQuestionType.MultipleChoice:
      return (
        <MultipleOptionsBoard
          readOnly={readOnly}
          data={data}
          correctIndexes={correctIndexes}
          value={value}
          onChange={onChange}
        />
      );
    case ExamQuestionType.TrueOrFalse:
      return (
        <TrueFalseOptionsBoard
          readOnly={readOnly}
          data={data}
          correct={correctIndexes?.[0] === 0}
          value={value?.[0]}
          onChange={(value) => onChange?.(value !== undefined ? [value] : [])}
        />
      );
    default:
      return null;
  }
}
