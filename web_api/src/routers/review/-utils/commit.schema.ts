import { queryInt } from "@/global/check.ts";
import { ExpectType, InferExpect, optional } from "@asla/wokao";

export const COMMIT_REVIEW_PARAM_SCHEMA = {
  review_id: queryInt,
  is_passed: "boolean",
  remark: optional.string,
} satisfies ExpectType;

export type BECommitReviewParam = InferExpect<typeof COMMIT_REVIEW_PARAM_SCHEMA>;
