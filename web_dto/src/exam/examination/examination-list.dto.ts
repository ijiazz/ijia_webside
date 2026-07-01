import type { CursorListResult } from "../../common.ts";

/** 考试状态 */
export enum ExaminationStatus {
  /** 待开始 */
  upcoming = "upcoming",
  /** 可开始 */
  ready = "ready",
  /** 进行中 */
  ongoing = "ongoing",
  /** 已结束 */
  ended = "ended",
  /** 出结果 */
  result = "result",
}
export type ExaminationListParam = {
  status?: ExaminationStatus | ExaminationStatus[];
  cursor?: string;
  limit?: number;
};
export type ExaminationListOutput = CursorListResult<ExaminationInfoOutput, string>;

export type ExaminationInfoOutput = {
  id: string;
  /** 考试名称 */
  title: string;
  /** 总分 */
  total_score: number;
  /** 得分 */
  score?: number | null;
  /** 允许查看成绩的时间 */
  result_allow_view_date?: string | null;
  /** 总使用时间限制，单位秒。0 为无限制 */
  use_time_total_limit: number;

  /** 出题人信息 */
  owner?: {
    id: string;
    nickname: string;
    avatar_url?: string;
  } | null;
  /** 考试状态 */
  status: ExaminationStatus;
  /** 允许开始时间 */
  allow_time_start: string | null;
  /** 允许结束时间 */
  allow_time_end: string | null;
  /** 题目数量 */
  question_number?: number | null;
};
