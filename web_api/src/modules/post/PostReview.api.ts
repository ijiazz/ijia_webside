import { GetPostCommentListParam } from "../../routers/post/comment/_dto.ts";
import { PostReviewItemDto, CommitReviewParam, CommitReviewResultDto } from "./PostReview.dto.ts";

export interface PostReviewApi {
  /** 获取帖子审核列表 */
  "GET /post/review/next": {
    response: PostReviewItemDto;
    query?: GetPostCommentListParam;
  };
  /** 获取帖子审核列表 */
  "POST /post/review/entity/:reviewId/commit": {
    response: CommitReviewResultDto;
    params: { reviewId: string | number };
    body: CommitReviewParam;
  };
}
