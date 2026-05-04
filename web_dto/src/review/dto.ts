import type { QuestionAdvancedConfig, UpdateQuestionParam } from "../exam.ts";
import type { ReviewDisplayItem, ReviewTargetType } from "./db.ts";

type ReviewItemBase = {
  id: string;
  create_time: number;
  resolved_time?: number;
  review_display?: ReviewDisplayItem[];
  is_passed?: boolean;
  is_reviewing: boolean;
  pass_count: number;
  reject_count: number;
  comment?: string;
  reviewer: {
    avatar?: string;
    nickname?: string;
    user_id: string;
  };
};

export type ReviewItem<Info> = ReviewItemBase & {
  target_type: ReviewTargetType;
  info: Info;
};

export type GetReviewListParam = {
  target_type?: ReviewTargetType;
  is_reviewing?: boolean;
  is_passed?: boolean;
  reviewer_id?: string;
};

export type CommitReviewParam = {
  review_id: string;
  is_passed: boolean;
  remark?: string;
};

export type CommitQuestionReviewParam = CommitReviewParam & {
  update?: UpdateQuestionParam;
  advanced_config?: QuestionAdvancedConfig;
};

export type CommitReviewResult<T = unknown> = {
  next?: ReviewItem<T>;
  success: boolean;
};
export type GetReviewNextResult<T = unknown> = {
  item?: ReviewItem<T>;
};
