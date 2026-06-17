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
/**
 * 创建一个空的，未绑定试卷的的考试
 */
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
      INSERT INTO exam_paper_template (exam_number)
      VALUES (1)
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
  const q = v.gen`
  WITH tb AS(
    UPDATE exam_paper_template
    SET exam_number = exam_number + 1
    WHERE id=${templateId}
    RETURNING id, question_total
  )
  INSERT INTO examination (template_id, question_total, user_id, title, allow_time_start, allow_time_end, use_time_total_limit)
    SELECT 
      id AS template_id,
      question_total,
      ${option.userId} user_id,
      ${option.title} title,
      ${option.allowTimeStart ?? null} allow_time_start,
      ${option.allowTimeEnd ?? null} allow_time_end,
      ${option.useTimeTotalLimit ?? 0} use_time_total_limit
    FROM tb
    RETURNING id
  `;

  const [result] = await dbPool.queryRows<{ id: number }>(q);
  return result?.id;
}
