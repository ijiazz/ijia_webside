import { Api, Context, JWT_TOKEN_KEY } from "#test/fixtures/hono.ts";
import { ExaminationStatus } from "@ijia/api-types";
import { v } from "@/sql/utils.ts";
import { dbPool } from "@/db/client.ts";
export * from "./examination/prepare_question.ts";

export async function createPracticeExamination(
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

export async function getExamination(api: Api, token: string, examId: string | number) {
  return api["/examination/:exam_id"].get({
    params: { exam_id: examId.toString() },
    [JWT_TOKEN_KEY]: token,
  });
}
export async function getExaminationTemplate(examId: number) {
  const sql = v.gen`SELECT template_id FROM examination WHERE id=${examId}`;
  return dbPool.queryFirstRow<{ template_id: number }>(sql);
}

export async function deleteExamination(api: Api, token: string, examId: string | number) {
  return api["/examination/:exam_id"].delete({
    params: { exam_id: examId.toString() },
    body: {},
    [JWT_TOKEN_KEY]: token,
  });
}
export async function getExaminationRealQuestionTotal(examId: number): Promise<number | undefined> {
  const sql = v.gen`SELECT count(*)::INT as total  FROM exam_paper_template_question
  WHERE paper_template_id=(SELECT template_id FROM examination WHERE id=${examId})`;
  const row = await dbPool.queryRows<{ total: number }>(sql);
  return row[0]?.total;
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

export async function setExaminationResultAllowViewDate(
  publicDbPool: Context["publicDbPool"],
  examinationId: string,
  sqlExpr: string,
) {
  await publicDbPool.execute(
    v.gen`UPDATE examination SET result_allow_view_date = ${new String(sqlExpr)} WHERE id=${examinationId}`,
  );
}
