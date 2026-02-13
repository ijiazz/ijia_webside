import type { ReviewDisplayItem, ReviewTargetType } from "./db.ts";

type ReviewItemBase = {
  id: number;
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
    user_id: number;
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
  reviewer_id?: number;
};

export type CommitReviewParam = {
  review_id: number;
  is_passed: boolean;
  remark?: string;
};
export type CommitReviewResult = {
  next?: ReviewItem<unknown>;
  success: boolean;
};
export type GetReviewNextResult = {
  item?: ReviewItem<unknown>;
};
