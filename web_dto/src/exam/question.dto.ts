import type { AssetAudio, AssetImage, ReviewStatus, TextStructure } from "../common.ts";

type QuestionMedia = AssetImage | AssetAudio;

type QuestionBase = {
  medias: QuestionMedia[];
  question_text: string;
  question_text_struct?: TextStructure[];
  /** 题目类型 */
  question_type: ExamQuestionType;
  options?: {
    media: QuestionMedia;
    text: string;
  }[];
};
/** 考试中返回的题目 */
export type ExamPaperPrivateQuestion = QuestionBase & {
  index: number /** 返回索引，确保题库被记录 */;
};

type QuestionPublic = QuestionBase & {
  question_id: string;
  difficulty_level: number;
  collection_level: number;

  /** 事件时间 */
  event_time?: string;
  /** 题目是否长期有效。（有些题目会随着时间变化答案会发生变化，如果答案永远不会发生变化，则为长期有效） */
  long_time?: boolean;

  create_time: string;
  update_time: string;

  /** 所属用户 */
  user?: {
    user_id: string;
    nickname: string;
    avatar_url?: string;
  } | null;

  comment: {
    comment_id: string;
    total_count: number;
  };
};

export type ExamQuestionReviewItem = QuestionBase & {
  event_time?: string;
  long_time?: boolean;
  create_time: string;
  update_time: string;
};

/** 交卷后，查看作答记录的题目 */
export type ExamPaperPublicQuestion = QuestionPublic & {
  index: number;

  /** 正确选项的索引 */
  answer_index: number[];
  answer_text: string;
  answer_text_struct?: TextStructure[];
};

/** 用户题目 */
export type ExamUserQuestion = QuestionPublic & {
  /** 正确选项的索引 */
  answer_index: number[];
  answer_text: string;
  answer_text_struct?: TextStructure[];

  review?: {
    status: ReviewStatus;
    reviewed_time?: string;
    reject_reason?: string;
  };
};
export enum ExamQuestionType {
  SingleChoice = "single_choice",
  MultipleChoice = "multiple_choice",
  TrueOrFalse = "true_false",
}
