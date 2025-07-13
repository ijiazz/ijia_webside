import { GetPostReviewListParam, PostReviewItem } from "./PostReview.dto.ts";

export interface PostReviewApi {
  /** 获取作品列表 */
  "GET /post/review/next": {
    response: PostReviewItem;
    query?: GetPostReviewListParam;
  };
  /** 点赞作品 */
  "POST /post/content/:postId/review": {
    body?: {};
    response: {
      success: boolean;
    };
  };
}
