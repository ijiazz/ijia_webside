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

export type AttachmentField = QuestionAttachment;
export type OptionField = QuestionOption;

export enum FormMode {
  Edit = "edit",
  FullEdit = "fullEdit",
}

export const FormModeContext = createContext<FormMode>(FormMode.Edit);
