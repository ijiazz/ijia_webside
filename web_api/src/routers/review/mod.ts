export { default } from "./_route.ts";

export { commitPostReview, setPostToReviewing, type CommitPostReviewParam as CommitReviewParam } from "./-sql/post.ts";

export { commitQuestionReview } from "./-sql/question.ts";
export { commitCommentReview, setCommentToReviewing } from "./-sql/comment.sql.ts";

import "./commit/question.post.ts";
import "./commit/post.post.ts";
import "./commit/comment.post.ts";

import "./next.$type.get.ts";
import "./list.get.ts";
