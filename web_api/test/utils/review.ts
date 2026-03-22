import { select } from "@asla/yoursql";
import { Api, JWT_TOKEN_KEY } from "../fixtures/hono.ts";
import { CommitReviewParam, ReviewStatus, ReviewTargetType } from "@/dto.ts";
import { dbPool } from "@/db/client.ts";
import { v } from "@/sql/utils.ts";

export async function getReviewNext(api: Api, config: { type: ReviewTargetType; token?: string }) {
  const { type, token } = config;
  return api["/review/next/:type"].get({
    params: {
      type: config.type,
    },
    [JWT_TOKEN_KEY]: token,
  });
}
export async function commitReview(api: Api, config: CommitReviewParam & { type: ReviewTargetType; token?: string }) {
  const { type, token, ...param } = config;
  return api["/review/commit/:type"].post({
    params: {
      type: config.type,
    },
    body: param,
    [JWT_TOKEN_KEY]: token,
  });
}
type ReviewInfoBase = {
  status: ReviewStatus;
  is_review_pass: boolean | null;
  reviewed_time: string | null;
  remark: string | null;
  reviewer_id: number | null;
};

export type QuestionReviewInfo = ReviewInfoBase & {
  review_id: number | null;
};
export async function getQuestionReviewStatus(questionId: number): Promise<QuestionReviewInfo> {
  const sql = select<QuestionReviewInfo>({
    status: "q.review_status",
    review_id: "q.id",
    reviewed_time: "r.resolved_time",
    reviewer_id: "r.reviewer_id",
    is_review_pass: "r.is_passed",
    remark: "r.comment",
  })
    .from("exam_question", { as: "q" })
    .leftJoin("review", { as: "r", on: `r.id=q.review_id` })
    .where(`q.id=${v(questionId)}`)
    .limit(1);

  return dbPool.queryFirstRow<QuestionReviewInfo>(sql);
}

export type PostReviewInfo = ReviewInfoBase & {
  review_id: number;
};
export async function getPostReviewStatus(postId: number): Promise<PostReviewInfo | null> {
  const review = await dbPool.queryFirstRow<PostReviewInfo>(
    select({
      status: "p.review_status",
      reviewed_time: "r.resolved_time",
      reviewer_id: "r.reviewer_id",
      is_review_pass: "r.is_passed",
      review_id: "r.id",
      remark: "r.comment",
    })
      .from("public.post", { as: "p" })
      .leftJoin("review", { as: "r", on: "r.id=p.review_id" })
      .where(`p.id=${v(postId)}`),
  );
  return review;
}
export type CommentReviewStatus = ReviewInfoBase & {
  review_id: number;
};
export async function getCommentReviewStatus(commentId: number): Promise<CommentReviewStatus | null> {
  const t = await dbPool.queryRows(
    select({
      status: "c.review_status",
      reviewed_time: "r.resolved_time",
      reviewer_id: "r.reviewer_id",
      is_review_pass: `r.is_passed`,
      review_id: "r.id",
      remark: "r.comment",
    })
      .from("post_comment", { as: "c" })
      .leftJoin("review", { as: "r", on: "r.id=c.review_id" })
      .where([`c.id=${v(commentId)}`]),
  );

  return (t[0] ?? null) as CommentReviewStatus | null;
}
