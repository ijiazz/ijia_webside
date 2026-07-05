import { HttpError } from "@/common/errors.ts";
import { dbPool } from "@/db/client.ts";
import { ReviewStatus } from "@/dto.ts";
import { v } from "@/sql/utils.ts";
import { select } from "@asla/yoursql";
import { DbExamination } from "@ijia/school-db/db";
import { DbTransaction } from "@asla/pg";

async function ensureTemplateQuestions(t: DbTransaction, templateId: number, questionTotal: number) {
  const [row] = await t.queryRows<{ total: number }>(v.gen`
    SELECT COUNT(*)::int AS total
    FROM exam_paper_template_question
    WHERE paper_template_id=${templateId}
  `);
  if (!row || row.total > 0 || questionTotal <= 0) {
    return;
  }
  const needAdd = questionTotal - row.total;
  if (needAdd <= 0) {
    return;
  }
  //TODO: 题库数量增多后，需要重新设计题目随机抽取逻辑
  await t.queryCount(v.gen`
  INSERT INTO exam_paper_template_question (index, paper_template_id, question_id, score, option_map)
    SELECT 
      (row_number() OVER () - 1) AS index,
      ${templateId} template_id, q.id question_id, 1 score,
      (SELECT ARRAY_AGG(index_map) FROM 
        (SELECT (row_number() OVER () - 1) AS index_map
          FROM exam_question_option AS qo
          WHERE qo.question_id = q.id AND q.question_type !='true_false'
          ORDER BY random()
        )
      AS option_map) option_map
    FROM (
      SELECT id, question_type
      FROM exam_question
      WHERE review_status=${ReviewStatus.passed}
        AND is_system_gen=FALSE
      ORDER BY random()
      LIMIT ${needAdd}
    ) AS q
  `);
  return;
}
type SelectRaw = Pick<
  DbExamination,
  "allow_time_start" | "allow_time_end" | "start_time" | "template_id" | "question_total"
>;
export async function startExamination(examId: number, userId: number) {
  await using t = dbPool.begin("REPEATABLE READ");

  const statusQuery = select<SelectRaw>([
    "allow_time_start",
    "allow_time_end",
    "start_time",
    "template_id",
    "question_total",
  ])
    .from("examination")
    .where([`id=${v(examId)}`, `user_id=${v(userId)}`]);

  const [row] = await t.queryRows(statusQuery);
  if (!row) throw new HttpError(404, "考试不存在");
  if (row.start_time) throw new HttpError(409, "考试已开始");

  const templateId = row.template_id;

  if (typeof templateId === "number" && row.question_total) {
    await ensureTemplateQuestions(t, templateId, row.question_total);
  }

  await t.execute(v.gen`UPDATE examination SET start_time=now() WHERE id=${examId}`);
  await t.commit();
}
