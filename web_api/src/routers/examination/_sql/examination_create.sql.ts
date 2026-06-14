import { HttpError } from "@/common/errors.ts";
import { dbPool } from "@/db/client.ts";
import { insertIntoValues, v } from "@/sql/utils.ts";

export type CreateExaminationOption = {
  title: string;
  userId: number;
  allowTimeStart?: Date;
  allowTimeEnd?: Date;
  useTimeTotalLimit?: number;
};
export async function createEmptyExamination(option: CreateExaminationOption) {
  const sql = insertIntoValues("examination", {
    user_id: option.userId,
    title: option.title,
    allow_time_start: option.allowTimeStart,
    allow_time_end: option.allowTimeEnd,
    use_time_total_limit: option.useTimeTotalLimit,
  }).returning<{ id: number }>(["id"]);
  const [examResult] = await dbPool.queryRows<{ id: number }>(sql);
  return examResult?.id;
}
export async function createExaminationByQuestionTotal(total: number, option: CreateExaminationOption) {
  if (!Number.isSafeInteger(total) || total < 0) throw new HttpError(400, "题目数量必须是非负整数");

  const sql = v.gen`
    WITH update AS (
      INSERT INTO exam_paper_template (question_total)
      VALUES (${total})
      RETURNING id
    )
    INSERT INTO examination (template_id, question_total, user_id, title, allow_time_start, allow_time_end, use_time_total_limit)
    SELECT 
      (SELECT id FROM update) template_id,
      ${total} question_total,
      ${option.userId} user_id,
      ${option.title} title,
      ${option.allowTimeStart ?? null} allow_time_start,
      ${option.allowTimeEnd ?? null} allow_time_end,
      ${option.useTimeTotalLimit ?? 0} use_time_total_limit
    RETURNING id
  `;
  const [examResult] = await dbPool.queryRows<{ id: number }>(sql);
  return examResult?.id;
}
export async function createExaminationByTemplate(templateId: number, option: CreateExaminationOption) {
  const insertQuery = v.gen`
    INSERT INTO examination (template_id, question_total, user_id, title, allow_time_start, allow_time_end, use_time_total_limit)
      SELECT 
        ${templateId} template_id,
        (SELECT question_total FROM exam_paper_template WHERE id=${templateId}) question_total,
        ${option.userId} user_id,
        ${option.title} title,
        ${option.allowTimeStart ?? null} allow_time_start,
        ${option.allowTimeEnd ?? null} allow_time_end,
        ${option.useTimeTotalLimit ?? 0} use_time_total_limit
      FROM exam_paper_template
      WHERE id=${templateId}
      LIMIT 1
    RETURNING id
  `;
  const [examResult] = await dbPool.queryRows<{ id: number }>(insertQuery);
  return examResult?.id;
}
