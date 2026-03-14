import type { CursorListResult, TextStructure } from "../common.ts";
import type { ExamQuestionType, ExamUserQuestion } from "./question.dto.ts";

type CreateQuestionUpdatable = {
  question_text: string;
  question_text_struct?: TextStructure[];
  /** 题目类型 */
  question_type: ExamQuestionType;
  options?: string[];

  /** 正确选项的索引 */
  answer_index: number[];
  explanation_text: string;
  explanation_text_struct?: TextStructure[];

  /** 事件时间 */
  event_time?: number;
  /** 题目是否长期有效。（有些题目会随着时间变化答案会发生变化，如果答案永远不会发生变化，则为长期有效） */
  long_time?: boolean;
};
export type CreateQuestionParam = CreateQuestionUpdatable & {
  /** 分类主题 */
  themes?: string[];
};
export type CreateQuestionResult = {
  question_id: string;
};

export type UpdateQuestionParam = Partial<CreateQuestionUpdatable> & {
  question_id: string;
};

export type GetUserQuestionListParam = {
  user_id?: string | number;
  cursor?: string;
};
export type GetUserQuestionListResult = CursorListResult<ExamUserQuestion, string> & {};
