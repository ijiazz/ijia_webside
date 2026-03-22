import { dbPool } from "@/db/client.ts";
import {
  CreateQuestionParam,
  ExamQuestionType,
  ReviewTargetType,
  UpdateQuestionParam,
  CommitQuestionReviewParam,
} from "@/dto.ts";
import { Api, JWT_TOKEN_KEY } from "#test/fixtures/hono.ts";
import { select, v } from "@asla/yoursql";

export async function createSampleQuestion(api: Api, token: string, body: Partial<CreateQuestionParam> = {}) {
  const baseQuestionBody: CreateQuestionParam = {
    question_text: "1 + 1 = ?",
    question_type: ExamQuestionType.SingleChoice,
    answer_index: [1],
    options: [{ text: "1" }, { text: "2" }, { text: "3" }],
    explanation_text: "1 加 1 等于 2",
  };
  return createQuestion(api, token, { ...baseQuestionBody, ...body });
}
export async function createQuestion(api: Api, token: string, body: CreateQuestionParam) {
  return api["/question/entity"].put({
    body: body,
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
export async function listUserQuestion(api: Api, option: { token?: string } = {}) {
  const { token } = option;
  return api["/question/list_user"].get({
    query: {},
    [JWT_TOKEN_KEY]: token,
  });
}

export async function getQuestionReviewNext(api: Api, token?: string) {
  return api["/review/next/:type"].get({
    params: { type: ReviewTargetType.exam_question },
    [JWT_TOKEN_KEY]: token,
  });
}

export async function commitQuestionReview(api: Api, token: string | undefined, body: CommitQuestionReviewParam) {
  return api["/review/commit/:type"].post({
    params: { type: ReviewTargetType.exam_question },
    body,
    [JWT_TOKEN_KEY]: token,
  });
}

export async function getQuestionReviewId(questionId: string): Promise<number> {
  const row = await dbPool.queryFirstRow<{ review_id: number | null }>(
    select("review_id")
      .from("exam_question")
      .where(`id=${v(questionId)}`),
  );
  if (row.review_id === null) throw new Error("题目没有对应的审核项");
  return row.review_id;
}

export async function getQuestionCount(userId: number) {
  const row = await dbPool.queryFirstRow<{ exam_question_count: number }>(
    select("exam_question_count")
      .from("user_profile")
      .where(`user_id=${v(userId)}`),
  );
  return row.exam_question_count;
}
