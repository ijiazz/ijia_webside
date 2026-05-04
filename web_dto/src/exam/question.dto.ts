import type { ReviewStatus, TextStructure } from "../common.ts";

export type QuestionAttachment = {
  text?: string;
  file?: { data: string; type: string };
};

export type QuestionOption = QuestionAttachment;

type QuestionBase = {
  question_text: string;
  question_text_struct?: TextStructure[];
  /** 题目类型 */
  question_type: ExamQuestionType;
  attachments?: QuestionAttachment[];

  options?: QuestionOption[];
};
export type ExamQuestionOwner = {
  user_id: number;
  nickname: string;
  avatar_url?: string;
};

export type ExamQuestionReviewInfo = {
  status: ReviewStatus;
  resolved_time?: string;
  comment?: string;
};
export type QuestionPublic = QuestionBase & {
  question_id: string;
  difficulty_level: number;
  collection_level: number;

  /** 所属用户 */
  user?: ExamQuestionOwner | null;

  comment: {
    id: string;
    total: number;
  };
  review?: ExamQuestionReviewInfo;
};

/** 考试中返回的题目 */
export type QuestionPrivate = QuestionBase & {
  index: number /** 返回索引，确保题库被记录 */;
};

/** 交卷后，查看作答记录的题目 */
export type ExamPaperPublicQuestion = QuestionPublic & {
  index: number;
  selected: number[];
  answer?: ExamQuestionAnswer;
};

export type ExamQuestionAnswer = {
  /** 正确选项的索引 */
  answer_index: number[];
  explanation_text: string;
  explanation_text_struct?: TextStructure[];
};

/** 用户题目列表 */
export type ExamUserQuestion = QuestionBase & {
  question_id: string;
  difficulty_level: number;
  collection_level: number;

  /** 所属用户 */
  user?: ExamQuestionOwner | null;
  comment: {
    id: string;
    total: number;
  };
  review?: ExamQuestionReviewInfo;
};

/* 用户题目详情 */
export type ExamUserQuestionDetail = ExamQuestionDetail;

export type ExamQuestionDetail = QuestionPublic & {
  create_time: string;
  update_time: string;
  /** 事件时间 */
  event_time?: string;
  /** 题目是否长期有效。（有些题目会随着时间变化答案会发生变化，如果答案永远不会发生变化，则为长期有效） */
  long_time?: boolean;
  answer: ExamQuestionAnswer;
};

export enum ExamQuestionType {
  SingleChoice = "single_choice",
  MultipleChoice = "multiple_choice",
  TrueOrFalse = "true_false",
}
