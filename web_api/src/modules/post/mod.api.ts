import { PostApi } from "./post.api.ts";
import { PostReviewApi } from "./PostReview.api.ts";
import { PostCommentApi } from "./comment.api.ts";

export type PostModuleAPI = PostApi & PostReviewApi & PostCommentApi;
