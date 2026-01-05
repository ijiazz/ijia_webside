import type { PostCommentDto } from "../../post_comment.ts";
import type { PostItemDto } from "./post.ts";

export enum PostReviewType {
  post = "post",
  postComment = "post_comment",
}

export type PostReviewDto<T = PostReviewTarget | PostCommentReviewTarget> = {
  review_id: string;
  review_type: PostReviewType;
  /** 如果已有审核结果，则存在。否则为 undefined 或 null */
  review_info?: PostReviewInfo | null;
  target: T;
};
export type PostReviewInfo = {
  /** 是否通过审核 */
  is_review_pass: boolean | null;
  /** 审核时间 */
  reviewed_time: Date | null;
  /** 审核备注 */
  remark: string | null;
  /** 审核人ID */
  reviewer_id?: number;
};
export type PostReviewTarget = Pick<
  PostItemDto,
  | "post_id"
  | "type"
  | "content_text"
  | "content_text_structure"
  | "media"
  | "update_time"
  | "publish_time"
  | "create_time"
  | "group"
>;
export type PostCommentReviewTarget = Pick<
  PostCommentDto,
  | "comment_id"
  | "post_id"
  | "content_text"
  | "content_text_structure"
  | "create_time"
  | "reply_count"
  | "root_comment_id"
  | "is_root_reply_count"
>;

export type PostReviewItemDto<T = PostReviewTarget | PostCommentReviewTarget> = {
  next?: PostReviewDto<T>;
};

export type CommitReviewResultDto<T = PostReviewTarget | PostCommentReviewTarget> = PostReviewItemDto<T> & {
  success: boolean;
};

export type CommitReviewParam = {
  /** 是否通过审核 */
  isPass: boolean;
  remark?: string;
};
