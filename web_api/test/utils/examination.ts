import { Api, Context, JWT_TOKEN_KEY } from "#test/fixtures/hono.ts";
import { ExaminationStatus } from "@ijia/api-types";
import { createSampleQuestion } from "./question.ts";
import { dbPool } from "@/db/client.ts";
import { v } from "@/sql/utils.ts";
import { ReviewStatus } from "@ijia/school-db/db";

export async function preparePassedQuestions(count: number, token: string, api: Context["api"]) {
  const questionIds: string[] = [];
  for (let index = 0; index < count; index++) {
    const { question_id } = await createSampleQuestion(api, token, { question_text: `考试题目-${index}` });
    questionIds.push(question_id);
  }

  await dbPool.execute(v.gen`
    UPDATE exam_question
    SET review_status=${ReviewStatus.passed}
    WHERE id = ANY(${questionIds.map((item) => Number(item))})
  `);
  return questionIds;
}

export async function createExamination(
  api: Api,
  token: string,
  body: { template_id: string } | { question_total: number },
) {
  return api["/examination"].put({
    body,
    [JWT_TOKEN_KEY]: token,
  });
}

export async function listExamination(
  api: Api,
  token: string,
  query: { cursor?: string; limit?: number; status?: ExaminationStatus } = {},
) {
  return api["/examination"].get({
    query,
    [JWT_TOKEN_KEY]: token,
  });
}

export async function getExamination(api: Api, token: string, examId: string) {
  return api["/examination/:exam_id"].get({
    params: { exam_id: examId },
    [JWT_TOKEN_KEY]: token,
  });
}

export async function deleteExamination(api: Api, token: string, examId: string) {
  return api["/examination/:exam_id"].delete({
    params: { exam_id: examId },
    body: {},
    [JWT_TOKEN_KEY]: token,
  });
}
