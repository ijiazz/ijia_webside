import { CommitQuestionReviewParam, CreateQuestionParam, ExamQuestionType, ReviewStatus } from "@/api.ts";
import { dbPool } from "@/db/client.ts";
import { getAppURLFromRoute } from "@/fixtures/test.ts";
import { api, JWT_TOKEN_KEY } from "@/utils/fetch.ts";
import { select, v } from "@asla/yoursql";

export async function createQuestion(token: string, body: Partial<CreateQuestionParam> = {}) {
  const defaultBody: CreateQuestionParam = {
    question_text: "1 + 1 = ?",
    question_type: ExamQuestionType.SingleChoice,
    answer_index: [1],
    options: [{ text: "1" }, { text: "2" }, { text: "3" }, { text: "4" }],
    explanation_text: "1 加 1 等于 2",
  };
  return api["/question/entity"].put({
    body: {
      ...defaultBody,
      ...body,
    },
    [JWT_TOKEN_KEY]: token,
  });
}

export function getUserQuestionURL(userId: number, search?: Record<string, string | number | boolean | undefined>) {
  return getAppURLFromRoute(`/user/${userId}/question`, search);
}

export async function getQuestionReviewId(questionId: string | number) {
  const row = await dbPool.queryFirstRow<{ review_id: number | null }>(
    select("review_id")
      .from("exam_question")
      .where(`id=${v(questionId)}`),
  );
  if (row.review_id === null) {
    throw new Error("题目没有对应的审核项");
  }
  return row.review_id;
}

export async function setQuestionReviewStatus(
  questionId: string | number,
  token: string,
  status: ReviewStatus,
  remark = status === ReviewStatus.passed ? "通过" : "驳回",
) {
  const reviewId = await getQuestionReviewId(questionId);
  const body: CommitQuestionReviewParam = {
    review_id: reviewId.toString(),
    is_passed: status === ReviewStatus.passed,
    remark,
  };
  return api["/review/commit/question"].post({
    body,
    [JWT_TOKEN_KEY]: token,
  });
}