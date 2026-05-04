import type { ListResult } from "./common.ts";
import type {
  CommitReviewParam,
  CommitQuestionReviewParam,
  CommitReviewResult,
  GetReviewListParam,
  GetReviewNextResult,
  ReviewItem,
} from "./review/dto.ts";
import type { ReviewTargetType } from "./review/db.ts";

export * from "./review/dto.ts";
export * from "./review/db.ts";

export interface ReviewApi {
  "GET /review/list": {
    response: ListResult<ReviewItem<unknown>>;
    query?: GetReviewListParam;
  };
  "GET /review/next/:type": {
    response: GetReviewNextResult;
    params: { type: ReviewTargetType };
  };
  "POST /review/commit/question": {
    body: CommitQuestionReviewParam;
    response: CommitReviewResult;
  };
  "POST /review/commit/:type": {
    body: CommitReviewParam;
    params: { type: ReviewTargetType };
    response: CommitReviewResult;
  };
}
