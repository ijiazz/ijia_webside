import type { TextStructure } from "../../common.ts";
import type {
  QuestionOption,
  QuestionAttachment,
  ExamQuestionType,
  ExamQuestionAnswer,
  ExamQuestionOwner,
} from "../question.ts";

export type ExaminationAnswerParam = {
  /** 题目序号 */
  index: number;
  /** 选择的选项索引列表 */
  answer: number[];
};

export type ExaminationQuestionResult = {
  /** 如果为空，表示全部做完 */
  question: QuestionPrivate | null;
};

export type ExaminationInfoResult = {
  /** 考试名称 */
  title: string;
  /** 出题人信息 */
  owner?: {
    id: string;
    nickname: string;
    avatar_url?: string;
  };
  /** 允许开始时间 */
  allow_time_start: string | null;
  /** 允许结束时间 */
  allow_time_end: string | null;
  /** 题目数量 */
  question_number: number;
};

/** 考试中返回的题目 */
export type QuestionPrivate = {
  question_text: string;
  question_text_struct?: TextStructure[];
  /** 题目类型 */
  question_type: ExamQuestionType;
  attachments?: QuestionAttachment[];

  options?: QuestionOption[];

  index: number /** 返回索引，确保题库被记录 */;
  /** 开始时间 */
  start_time: string;
  /** 时间限制（单位毫秒），null表示无时间限制 */
  time_limit: number | null;
};
/** 交卷后，查看作答记录的题目 */
export type ExaminationRecordQuestion = QuestionPrivate & {
  selected: number[];

  question_id: string;
  difficulty_level: number;

  /** 所属用户 */
  user?: ExamQuestionOwner | null;

  comment: {
    id: string;
    total: number;
  };
  answer?: ExamQuestionAnswer;
};

export type ExaminationRecordResult = {
  questions: ExaminationRecordQuestion[];
};

export type ExaminationResultResult = {
  /** 总用时（单位毫秒） */
  use_time_total: number;
  /** 正确题目数量 */
  correct_number: number;
  /** 错误题目数量 */
  wrong_number: number;
  /** 未答题目数量 */
  unanswered_number: number;
};
