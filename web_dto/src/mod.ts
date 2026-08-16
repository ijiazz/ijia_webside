import type { UserApi } from "./user.ts";
import type { ClassApi } from "./class.ts";
import type { LiveApi } from "./live.ts";
import type { PostApi } from "./post.ts";
import type { ReviewApi } from "./review.ts";
import type { CommentAPI } from "./comment.ts";
import type { QuestionAPI, ExaminationAPI } from "./exam.ts";

export interface ApiDefined
  extends PostApi, ClassApi, LiveApi, UserApi, ReviewApi, CommentAPI, QuestionAPI, ExaminationAPI {}
export * from "./common.ts";
export * from "./file.ts";
export * from "./post.ts";
export * from "./comment.ts";
export * from "./class.ts";
export * from "./live.ts";
export * from "./user.ts";
export * from "./review.ts";
export * from "./exam.ts";
