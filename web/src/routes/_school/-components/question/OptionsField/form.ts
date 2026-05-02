import { ExamQuestionType, QuestionAttachment, QuestionOption } from "@/api.ts";
import { createContext } from "react";
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
  attachments?: AttachmentField[];
  options?: OptionField[];
};
export type EditQuestionFormInput = Partial<EditQuestionFormFields>;

export type AttachmentField = QuestionAttachment;
export type OptionField = QuestionOption;

export enum QuestionEditMode {
  /**编辑模式，部分字段只读，无法更改题型 */
  Edit = "edit",
  /**全编辑模式 */
  FullEdit = "fullEdit",
}

export const FormModeContext = createContext<QuestionEditMode>(QuestionEditMode.Edit);
