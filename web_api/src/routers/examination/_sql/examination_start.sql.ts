import { HttpError } from "@/common/errors.ts";
import { dbPool } from "@/db/client.ts";
import { ReviewStatus } from "@ijia/api-types";
import { v } from "@/sql/utils.ts";
import { select } from "@asla/yoursql";
import { DbExamination } from "@ijia/school-db/db";
import { DbTransaction } from "@asla/pg";
import { PaperTemplateGenRules } from "../_utils/question_gen_rules.ts";

async function insertQuestion(t: DbTransaction, templateId: number, genRules: PaperTemplateGenRules) {
  const { total, rules } = genRules;

  const selected = rules
    .map(({ number, score, timeLimit, type }) => {
      return v.gen`
      SELECT q.id, ${score}::INT AS score, ${timeLimit ?? null}::INT AS time_limit, q.question_type
      FROM (
        SELECT id, question_type
        FROM exam_question
        WHERE review_status=${ReviewStatus.passed}
          ${new String(type ? v.gen`AND question_type=${type}` : "")}
          AND is_system_gen=FALSE
        ORDER BY random()
        LIMIT ${number}
      ) AS q`;
    })
    .join(" UNION ALL ");

  const sql = v.gen`
  WITH q AS (${new String(selected)})
  INSERT INTO exam_paper_template_question (index, paper_template_id, question_id, score, time_limit, option_map)
    SELECT 
      (row_number() OVER () - 1) AS index,
      ${templateId} paper_template_id,
      q.id question_id, q.score, q.time_limit,
      (SELECT ARRAY_AGG(index_map) FROM 
        (SELECT (row_number() OVER () - 1) AS index_map
          FROM exam_question_option AS qo
          WHERE qo.question_id = q.id AND q.question_type !='true_false'
          ORDER BY random()
        )
      ) option_map
    FROM q
  `;
  //TODO: 题库数量增多后，需要重新设计题目随机抽取逻辑
  const number = await t.queryCount(sql);
  return number;
}
async function ensureTemplateQuestions(t: DbTransaction, templateId: number) {
  const [row] = await t.queryRows<{ gen_rules: PaperTemplateGenRules }>(v.gen`
    SELECT gen_rules
    FROM exam_paper_template
    WHERE id=${templateId} AND gen_rules IS NOT NULL
  `);
  if (!row) return;
  const rules = row.gen_rules;
  const addedCount = await insertQuestion(t, templateId, rules);
  await t.execute(v.gen`
    UPDATE exam_paper_template SET 
      gen_rules=NULL,
      question_total=question_total+${addedCount}
      WHERE id=${templateId}`);
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
    await ensureTemplateQuestions(t, templateId);
  }

  await t.execute(v.gen`UPDATE examination SET start_time=now() WHERE id=${examId}`);
  await t.commit();
}
