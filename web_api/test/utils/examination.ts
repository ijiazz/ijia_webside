import { Api, JWT_TOKEN_KEY } from "#test/fixtures/hono.ts";
import { ExaminationStatus } from "@ijia/api-types";
export * from "./examination/prepare_question.ts";
export * from "./examination/ExamPlan.ts";
export * from "./examination/query.ts";

export async function createPracticeExamination(
  api: Api,
  token: string,
  body: { template_id: string; question_total?: undefined } | { question_total: number },
) {
  return api["/examination"].put({
    body:
      body.question_total !== undefined
        ? { paperTemplate: { questions: { number: body.question_total } } }
        : { template_id: body.template_id },
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

export async function getExamination(api: Api, token: string, examId: string | number) {
  return api["/examination/:exam_id"].get({
    params: { exam_id: examId.toString() },
    [JWT_TOKEN_KEY]: token,
  });
}

export async function deleteExamination(api: Api, token: string, examId: string | number) {
  return api["/examination/:exam_id"].delete({
    params: { exam_id: examId.toString() },
    body: {},
    [JWT_TOKEN_KEY]: token,
  });
}

export async function startExamination(api: Api, token: string, examId: string | number) {
  return api["/examination/:exam_id/start"].post({
    params: { exam_id: examId.toString() },
    [JWT_TOKEN_KEY]: token,
  });
}

export async function nextExaminationQuestion(api: Api, token: string, examId: string | number) {
  return api["/examination/:exam_id/next"].post({
    params: { exam_id: examId.toString() },
    [JWT_TOKEN_KEY]: token,
  });
}

export async function answerExaminationQuestion(
  api: Api,
  token: string,
  examId: string | number,
  body: { index: number; answer: number[] },
) {
  return api["/examination/:exam_id/answer"].post({
    params: { exam_id: examId.toString() },
    body,
    [JWT_TOKEN_KEY]: token,
  });
}

export async function endExamination(api: Api, token: string, examId: string | number) {
  return api["/examination/:exam_id/end"].post({
    params: { exam_id: examId.toString() },
    [JWT_TOKEN_KEY]: token,
  });
}

export async function getExaminationRecord(api: Api, token: string, examId: string | number) {
  return api["/examination/:exam_id/record"].get({
    params: { exam_id: examId.toString() },
    [JWT_TOKEN_KEY]: token,
  });
}

export async function getExaminationResult(api: Api, token: string, examId: string | number) {
  return api["/examination/:exam_id/result"].get({
    params: { exam_id: examId.toString() },
    [JWT_TOKEN_KEY]: token,
  });
}
