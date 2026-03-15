import type { CursorListResult, TextStructure, MediaType } from "../common.ts";
import type { ExamQuestionType, ExamUserQuestion } from "./question.dto.ts";

export type QuestionMediaUpdate = {
  title?: string | null;
  type: MediaType.audio | MediaType.image;
  uri: string;
};

type CreateQuestionUpdatable = {
  question_text: string;
  question_text_struct?: TextStructure[] | null;

  explanation_text: string;
  explanation_text_struct?: TextStructure[] | null;

  /** 事件时间 */
  event_time?: string;
  /** 题目是否长期有效。（有些题目会随着时间变化答案会发生变化，如果答案永远不会发生变化，则为长期有效） */
  long_time?: boolean;
  /** 分类主题 */
  themes?: string[];
};
export type CreateQuestionParam = CreateQuestionUpdatable & {
  /** 题目类型 */
  question_type: ExamQuestionType;

  question_medias?: QuestionMediaUpdate[] | null;
  options: {
    text: string;
    media?: QuestionMediaUpdate | null;
    is_answer?: boolean;
  }[];
};
export type CreateQuestionResult = {
  question_id: string;
};

export type UpdateQuestionParam = Partial<CreateQuestionUpdatable> & {
  add_medias?: QuestionMediaUpdate[] | null;
  add_options?: {
    text: string;
    media?: QuestionMediaUpdate | null;
    is_answer?: boolean;
  }[];
  options: Record<
    number,
    {
      text: string | null;
      media?: QuestionMediaUpdate | null;
    }
  >;
  question_medias?: Record<number, QuestionMediaUpdate | null>;
};

export type GetUserQuestionListParam = {
  user_id?: string | number;
  cursor?: string;
};
export type GetUserQuestionListResult = CursorListResult<ExamUserQuestion, string> & {};
