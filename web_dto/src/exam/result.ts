import type { ExamUserQuestionDetail } from "./question.dto.ts";

export type GetUserQuestionResult = {
  item: ExamUserQuestionDetail;
};

export type ExamPublicQuestionStatsResult = {
  reviewing_count: number;
  passed_count: number;
};
