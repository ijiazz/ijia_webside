import { ExamQuestionType } from "@/api.ts";

export const QUESTION_TYPE_LABEL: Record<ExamQuestionType, string> = {
  [ExamQuestionType.SingleChoice]: "单选题",
  [ExamQuestionType.MultipleChoice]: "多选题",
  [ExamQuestionType.TrueOrFalse]: "判断题",
};
