export { default } from "./_route.ts";

export {
  commitPostCommentReview,
  commitPostReview,
  setPostCommentToReviewing,
  setPostToReviewing,
  type CommitReviewParam,
} from "./-sql/post.ts";

export { commitQuestionReview } from "./-sql/question.ts";

import "./commit/question.post.ts";
import "./commit/post.post.ts";
import "./commit/post_comment.post.ts";

import "./next.$type.get.ts";
import "./list.get.ts";
