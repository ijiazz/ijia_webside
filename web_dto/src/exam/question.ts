import type { CursorListResult, TextStructure } from "../common.ts";
import type { ExamQuestionType, ExamUserQuestion, QuestionAttachment, QuestionOption } from "./question.dto.ts";

type CreateQuestionUpdatable = {
  question_text: string;
  question_text_struct?: TextStructure[] | null;

  explanation_text: string;
  explanation_text_struct?: TextStructure[] | null;

  answer_index: number[];

  /** 事件时间 */
  event_time?: string;
};
export type CreateQuestionParam = CreateQuestionUpdatable & {
  /** 题目类型 */
  question_type: ExamQuestionType;
  attachments?: QuestionAttachment[];
  options?: QuestionOption[];
  /** 仅有 Admin 权限可以设置的高级配置 */
  advanced_config?: QuestionAdvancedConfig;
};

export type CreateQuestionResult = {
  question_id: string;
};

export type UpdateQuestionParam = Partial<CreateQuestionUpdatable> & {
  attachments?: QuestionAttachment[];
  options?: QuestionOption[];
};

export type QuestionAdvancedConfig = {
  /** 题目是否长期有效。（有些题目会随着时间变化答案会发生变化，如果答案永远不会发生变化，则为长期有效） */
  long_time?: boolean;
  themes?: string[];
  /** 题目难度等级  范围 0~5.*/
  difficulty_level?: number;
  /** 题目收藏等级  可选值为 0，1，2，3, 表示题目出得是不是很特别。刷题只能刷到 0 和 1 的题目 */
  collection_level?: number;
};

export type GetUserQuestionListParam = {
  cursor?: string;
  userId?: number;
};
export type GetUserQuestionListResult = CursorListResult<ExamUserQuestion, string> & {};
