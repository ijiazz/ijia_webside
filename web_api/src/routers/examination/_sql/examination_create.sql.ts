import { dbPool } from "@/db/client.ts";
import { insertIntoValues, v } from "@/sql/utils.ts";
import { DbExamPaperTemplate } from "@ijia/school-db/db";
import { PaperTemplateGenRules } from "../_utils/question_gen_rules.ts";

export type CreateExaminationOption = {
  title: string;
  userId: number;
  allowTimeStart?: Date;
  allowTimeEnd?: Date;
  resultAllowViewDate?: Date;
  /** 单位毫秒 */
  useTimeTotalLimit?: number;
};
/**
 * 创建一个空的，未绑定试卷的的考试
 */
export async function createEmptyExamination(option: CreateExaminationOption): Promise<number> {
  const sql = insertIntoValues("examination", {
    user_id: option.userId,
    title: option.title,
    allow_time_start: option.allowTimeStart,
    allow_time_end: option.allowTimeEnd,
    allow_result_view_date: option.resultAllowViewDate,
    use_time_total_limit: option.useTimeTotalLimit,
  }).returning<{ id: number }>(["id"]);
  const examResult = await dbPool.queryFirstRow<{ id: number }>(sql);
  return examResult.id;
}
export async function createExaminationByRules(
  option: CreateExaminationOption,
  template: { rules: PaperTemplateGenRules; ownerId: number },
): Promise<number | undefined> {
  const { ownerId, rules } = template;
  await using t = dbPool.begin();
  const { id: templateId } = await t.queryFirstRow(
    insertIntoValues("exam_paper_template", {
      gen_rules: rules,
      owner_id: ownerId,
    } satisfies Partial<DbExamPaperTemplate>).returning<{ id: number }>("id"),
  );

  const [examResult] = await t.queryRows<{ id: number }>(createExamFromTemplate(templateId, option));
  await t.commit();
  return examResult?.id;
}

function createExamFromTemplate(templateId: number, option: CreateExaminationOption) {
  const q = v.gen`
  WITH tb AS(
    UPDATE exam_paper_template
    SET exam_number = exam_number + 1
    WHERE id=${templateId}
    RETURNING id, gen_rules
  ), info AS (
    SELECT count(*)::INT AS question_total, COALESCE(sum(score), 0)::INT AS grade_total, ${templateId} AS id FROM exam_paper_template_question WHERE paper_template_id =${templateId}
  )
  INSERT INTO examination (template_id, question_total, grade_total, user_id, title, allow_time_start, allow_time_end, result_allow_view_date, use_time_total_limit)
    SELECT 
      info.id AS template_id,
      (info.question_total + (SELECT COALESCE(gen_rules->>'question_total', '0')::INT FROM tb)) AS question_total,
      (info.grade_total + (SELECT COALESCE(gen_rules->>'score_total', '0')::int FROM tb)) AS grade_total,
      ${option.userId} user_id,
      ${option.title} title,
      ${option.allowTimeStart ?? null} allow_time_start,
      ${option.allowTimeEnd ?? null} allow_time_end,
      ${option.resultAllowViewDate ?? null} result_allow_view_date,
      ${option.useTimeTotalLimit ?? 0} use_time_total_limit
    FROM info
    RETURNING id
  `;
  return q;
}
export async function createExaminationByTemplate(
  templateId: number,
  option: CreateExaminationOption,
): Promise<number | undefined> {
  const [result] = await dbPool.queryRows<{ id: number }>(createExamFromTemplate(templateId, option));
  return result?.id;
}
