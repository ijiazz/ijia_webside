import type { ExamQuestionReviewItem } from "./question.dto.ts";
import type { UpdateQuestionParam } from "./question.ts";

export type QuestionCommitReviewParam = {
  is_passed: boolean;
  remark?: string;
  update?: UpdateQuestionParam;
};
export type QuestionCommitReviewResult = {
  next?: GetQuestionReviewNextResult;
  success: boolean;
};

export type GetQuestionReviewNextResult = {
  review_id?: string;
  question_id?: string;
  item?: ExamQuestionReviewItem;

  can_update_question: boolean;

  pass_count?: number;
  reject_count?: number;
};
