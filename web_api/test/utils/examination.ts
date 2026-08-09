import { getAPI, JWT_TOKEN_KEY } from "#test/fixtures/hono.ts";
import { ExamQuestionType, ExaminationStatus } from "@ijia/api-types";
import type { PrepareExaminationInput, TemplateQuestionInput } from "@ijia/api-types/test";
export * from "./examination/ExamPlan.ts";
export * from "./examination/query.ts";

/**
 * 答案为 0、1、2
 */
export const DEFAULT_QUESTIONS: TemplateQuestionInput[] = [
  { answer_index: [0], question_type: ExamQuestionType.SingleChoice },
  { answer_index: [1], question_type: ExamQuestionType.SingleChoice },
  { answer_index: [2], question_type: ExamQuestionType.SingleChoice },
];

export function prepareExaminationTemplate(questions: TemplateQuestionInput[], options: { ownerId?: number } = {}) {
  const api = getAPI();
  return api["/test/template/prepare"].post({
    body: { questions, ownerId: options.ownerId },
  });
}

export async function prepareExamination(option: PrepareExaminationInput): Promise<number> {
  const api = getAPI();
  const { number } = await api["/test/examination/prepare"].post({
    body: option,
  });
  return number;
}

export async function createPracticeExamination(
  token: string,
  body: { template_id: string; question_total?: undefined } | { question_total: number },
) {
  const api = getAPI();
  return api["/examination"].put({
    body:
      body.question_total !== undefined
        ? { paperTemplate: { questions: { number: body.question_total } } }
        : { template_id: body.template_id },
    [JWT_TOKEN_KEY]: token,
  });
}

export async function listExamination(
  token: string,
  query: { cursor?: string; limit?: number; status?: ExaminationStatus } = {},
) {
  const api = getAPI();
  return api["/examination"].get({
    query,
    [JWT_TOKEN_KEY]: token,
  });
}

export async function getExamination(token: string, examId: string | number) {
  const api = getAPI();
  return api["/examination/:exam_id"].get({
    params: { exam_id: examId.toString() },
    [JWT_TOKEN_KEY]: token,
  });
}

export async function deleteExamination(token: string, examId: string | number) {
  const api = getAPI();
  return api["/examination/:exam_id"].delete({
    params: { exam_id: examId.toString() },
    body: {},
    [JWT_TOKEN_KEY]: token,
  });
}

export async function startExamination(token: string, examId: string | number) {
  const api = getAPI();
  return api["/examination/:exam_id/start"].post({
    params: { exam_id: examId.toString() },
    [JWT_TOKEN_KEY]: token,
  });
}

export async function nextExaminationQuestion(token: string, examId: string | number) {
  const api = getAPI();
  return api["/examination/:exam_id/next"].post({
    params: { exam_id: examId.toString() },
    [JWT_TOKEN_KEY]: token,
  });
}

export async function answerExaminationQuestion(
  token: string,
  examId: string | number,
  body: { index: number; answer: number[] },
) {
  const api = getAPI();
  return api["/examination/:exam_id/answer"].post({
    params: { exam_id: examId.toString() },
    body,
    [JWT_TOKEN_KEY]: token,
  });
}

export async function endExamination(token: string, examId: string | number) {
  const api = getAPI();
  return api["/examination/:exam_id/end"].post({
    params: { exam_id: examId.toString() },
    [JWT_TOKEN_KEY]: token,
  });
}

export async function getExaminationRecord(token: string, examId: string | number) {
  const api = getAPI();
  return api["/examination/:exam_id/record"].get({
    params: { exam_id: examId.toString() },
    [JWT_TOKEN_KEY]: token,
  });
}

export async function getExaminationResult(token: string, examId: string | number) {
  const api = getAPI();
  return api["/examination/:exam_id/result"].get({
    params: { exam_id: examId.toString() },
    [JWT_TOKEN_KEY]: token,
  });
}
