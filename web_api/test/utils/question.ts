import { dbPool } from "@/db/client.ts";
import { CreateQuestionParam, ExamQuestionType, QuestionCommitReviewParam, UpdateQuestionParam } from "@/dto.ts";
import { Api, JWT_TOKEN_KEY } from "#test/fixtures/hono.ts";
import { select, v } from "@asla/yoursql";

export async function createSampleQuestion(api: Api, token: string, body: Partial<CreateQuestionParam> = {}) {
  const baseQuestionBody: CreateQuestionParam = {
    question_text: "1 + 1 = ?",
    question_type: ExamQuestionType.SingleChoice,
    options: [{ text: "1" }, { text: "2", is_answer: true }, { text: "3" }],
    explanation_text: "1 加 1 等于 2",
  };
  return api["/question/entity"].put({
    body: { ...baseQuestionBody, ...body },
    [JWT_TOKEN_KEY]: token,
  });
}
export async function deleteQuestion(api: Api, questionId: string | number, token: string) {
  await api["/question/entity/:question_id"].delete({
    params: { question_id: questionId.toString() },
    [JWT_TOKEN_KEY]: token,
  });
}
export async function updateQuestion(param: {
  api: Api;
  questionId: string;
  token?: string;
  body: UpdateQuestionParam;
}) {
  const { api, questionId, token, body } = param;
  await api["/question/entity/:question_id"].patch({
    params: { question_id: questionId.toString() },
    body: body,
    [JWT_TOKEN_KEY]: token,
  });
}
export async function getQuestion(api: Api, questionId: string, token?: string) {
  return api["/question/entity/:question_id"].get({
    params: { question_id: questionId },
    [JWT_TOKEN_KEY]: token,
  });
}
export async function listUserQuestion(api: Api, option: { token?: string; userId?: number | string } = {}) {
  const { token, userId } = option;
  return api["/question/list_user"].get({
    query: { user_id: userId },
    [JWT_TOKEN_KEY]: token,
  });
}

export async function getQuestionReviewNext(api: Api, token?: string) {
  return api["/question/review/next"].get({
    [JWT_TOKEN_KEY]: token,
  });
}

export async function commitQuestionReview(
  api: Api,
  reviewId: number,
  token: string | undefined,
  body: QuestionCommitReviewParam,
) {
  return api["/question/review/entity/:review_id/commit"].post({
    params: { review_id: reviewId.toString() },
    body,
    [JWT_TOKEN_KEY]: token,
  });
}

export async function getQuestionReviewId(questionId: string | number): Promise<number> {
  const row = await dbPool.queryFirstRow<{ review_id: number | null }>(
    select("review_id")
      .from("exam_question")
      .where(`id=${v(questionId)}`),
  );
  if (row.review_id === null) throw new Error("题目没有对应的审核项");
  return row.review_id;
}

export async function getQuestionDbState(questionId: string | number) {
  return dbPool.queryFirstRow<{
    user_id: number | null;
    is_system_gen: boolean;
    review_status: string | null;
    question_text: string;
    answer_text: string | null;
  }>(
    select(["user_id", "is_system_gen", "review_status", "question_text", "answer_text"])
      .from("exam_question")
      .where(`id=${v(questionId)}`),
  );
}

export async function getQuestionCount(userId: number) {
  const row = await dbPool.queryFirstRow<{ exam_question_count: number }>(
    select("exam_question_count")
      .from("user_profile")
      .where(`user_id=${v(userId)}`),
  );
  return row.exam_question_count;
}
