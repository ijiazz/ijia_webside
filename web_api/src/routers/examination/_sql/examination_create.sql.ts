import { dbPool } from "@/db/client.ts";
import { insertIntoValues, v } from "@/sql/utils.ts";
import { PaperTemplateGenRules } from "@ijia/api-types";
import { DbExamPaperTemplate } from "@ijia/school-db/db";

export type CreateExaminationOption = {
  title: string;
  userId: number;
  allowTimeStart?: Date;
  allowTimeEnd?: Date;
  resultAllowViewDate?: Date;
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
    allow_result_view_date: option.resultAllowViewDate,
    use_time_total_limit: option.useTimeTotalLimit,
  }).returning<{ id: number }>(["id"]);
  const [examResult] = await dbPool.queryRows<{ id: number }>(sql);
  return examResult?.id;
}
export async function createExaminationByQuestionTotal(
  option: CreateExaminationOption,
  templateRules: PaperTemplateGenRules,
) {
  await using t = dbPool.begin();
  const { id: templateId } = await t.queryFirstRow(
    insertIntoValues("exam_paper_template", {
      gen_rules: templateRules,
      owner_id: option.userId,
    } satisfies Partial<DbExamPaperTemplate>).returning<{ id: number }>("id"),
  );

  const [examResult] = await dbPool.queryRows<{ id: number }>(createExamTemplate(templateId, option));
  await t.commit();
  return examResult?.id;
}
function createExamTemplate(templateId: number, option: CreateExaminationOption) {
  const q = v.gen`
  WITH tb AS(
    UPDATE exam_paper_template
    SET exam_number = exam_number + 1
    WHERE id=${templateId}
    RETURNING id, question_total
  )
  INSERT INTO examination (template_id, question_total, user_id, title, allow_time_start, allow_time_end, result_allow_view_date, use_time_total_limit)
    SELECT 
      id AS template_id,
      question_total,
      ${option.userId} user_id,
      ${option.title} title,
      ${option.allowTimeStart ?? null} allow_time_start,
      ${option.allowTimeEnd ?? null} allow_time_end,
      ${option.resultAllowViewDate ?? null} result_allow_view_date,
      ${option.useTimeTotalLimit ?? 0} use_time_total_limit
    FROM tb
    RETURNING id
  `;
  return q;
}
export async function createExaminationByTemplate(templateId: number, option: CreateExaminationOption) {
  const [result] = await dbPool.queryRows<{ id: number }>(createExamTemplate(templateId, option));
  return result?.id;
}
