import { ExamQuestionType, QuestionAttachment, QuestionOption } from "@/api.ts";

export type EditQuestionFormFields = {
  question_text: string;
  // question_text_struct?: TextStructure[] | null;

  explanation_text: string;
  // explanation_text_struct?: TextStructure[] | null;

  answer_index: number[];

  /** 事件时间 */
  event_time?: string;

  /** 题目类型 */
  question_type: ExamQuestionType;
  attachments?: QuestionAttachment[];
  options?: QuestionOption[];
};
