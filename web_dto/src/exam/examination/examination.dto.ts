import type { TextStructure } from "../../common.ts";
import type {
  QuestionOption,
  QuestionAttachment,
  ExamQuestionType,
  ExamQuestionAnswer,
  ExamQuestionOwner,
} from "../question.ts";

export type ExaminationAnswerInput = {
  /** 题目序号 */
  index: number;
  /** 选择的选项索引列表 */
  answer: number[];
};

export type ExaminationQuestionOutput = {
  /** 如果为空，表示全部做完 */
  question:
    | (QuestionPrivate & {
        /** 返回索引，确保题库被记录 */
        index: number;
        /** 开始做题的时间 */
        start_time: string;
      })
    | null;
};

/** 考试中返回的题目 */
export type QuestionPrivate = {
  question_text: string;
  question_text_struct?: TextStructure[];
  /** 题目类型 */
  question_type: ExamQuestionType;
  attachments?: QuestionAttachment[];

  options?: QuestionOption[];

  /** 时间限制（单位秒），null表示无时间限制 */
  time_limit?: number | null;
  /** 题目总分 */
  score_total: number;
};

export type QuestionRecordItem = QuestionPrivate & {
  question_id: string;
  difficulty_level: number;
  /** 所属用户 */
  user?: ExamQuestionOwner | null;

  comment?: {
    id: string;
    total: number;
  } | null;
  answer?: ExamQuestionAnswer;
};
/** 交卷后，查看作答记录的题目 */
export type ExaminationRecordQuestion = {
  index: number;
  selected: number[] | null;
  score: number | null;
  isTimeout: boolean;
  use_time: number | null;
  question: QuestionRecordItem | null;
};

export type ExaminationRecordOutput = {
  questions: ExaminationRecordQuestion[];
};

export type ExaminationResultOutput = {
  /** 最终成绩 */
  grade: number;
  /** 有效时间消耗（单位毫秒） */
  effective_time_consumption: number;
  /** 正确题目数量 */
  correct_number: number;
  /** 部分正确题目数量 */
  partially_correct_number: number;
  /** 错误题目数量 */
  wrong_number: number;
  /** 未答题目数量 */
  unanswered_number: number;
};

type CreateExaminationOption = {
  /** 考试允许开始的时间 */
  allowTimeStart?: string;
  /** 考试允许结束的时间 */
  allowTimeEnd?: string;
  /** 允许查看考试结果的时间 */
  resultAllowViewDate?: string;
  /** 总时间限制（单位秒），默认不限制 */
  useTimeTotalLimit?: number;
};
export type QuestionRules = {
  /** 题型数量 */
  number?: number;
  /** 题型分数 */
  score?: number;
  /** 题型时间限制（单位秒） */
  timeLimit?: number;
};
export type PaperTemplateGenRules = {
  questions?: QuestionRules;
  questionByType?: {
    [key in ExamQuestionType]?: QuestionRules;
  };
};
export type ExaminationCreateByTemplate = CreateExaminationOption & {
  template_id: string;
  template?: undefined;
};
export type ExaminationCreateByNewTemplate = CreateExaminationOption & {
  template_id?: undefined;
  paperTemplate?: PaperTemplateGenRules;
};

export type ExaminationCreateInput = ExaminationCreateByTemplate | ExaminationCreateByNewTemplate;
export type ExaminationCreateOutput = {
  examination_id: string;
};

export type ExaminationDeleteInput = {};
