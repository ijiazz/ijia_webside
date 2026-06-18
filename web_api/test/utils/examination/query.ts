import { Context } from "#test/fixtures/hono.ts";
import { v } from "@/sql/utils.ts";
import { dbPool } from "@/db/client.ts";

export async function setExaminationAllowDate(examId: number, option: { from?: Date; to?: Date }) {
  const { from, to } = option;
  await dbPool.execute(v.gen`
    UPDATE examination
    SET allow_time_start = ${from}, allow_time_end = ${to}
    WHERE id=${examId}
  `);
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
export async function getExaminationRealQuestionTotal(examId: number): Promise<number | undefined> {
  const sql = v.gen`SELECT count(*)::INT as total  FROM exam_paper_template_question
  WHERE paper_template_id=(SELECT template_id FROM examination WHERE id=${examId})`;
  const row = await dbPool.queryRows<{ total: number }>(sql);
  return row[0]?.total;
}
export async function getExaminationTemplate(examId: number) {
  const sql = v.gen`SELECT template_id FROM examination WHERE id=${examId}`;
  return dbPool.queryFirstRow<{ template_id: number }>(sql);
}
