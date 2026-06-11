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
  status?: ExaminationStatus;
  cursor?: string;
  limit?: number;
};
export type ExaminationListResult = CursorListResult<ExaminationInfoResult, string>;

export type ExaminationInfoResult = {
  /** 考试名称 */
  title: string;
  /** 出题人信息 */
  owner?: {
    id: string;
    nickname: string;
    avatar_url?: string;
  };
  /** 考试状态 */
  status: ExaminationStatus;
  /** 允许开始时间 */
  allow_time_start: string | null;
  /** 允许结束时间 */
  allow_time_end: string | null;
  /** 题目数量 */
  question_number?: number;
};
