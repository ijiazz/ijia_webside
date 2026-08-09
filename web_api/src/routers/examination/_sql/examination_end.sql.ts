import { HttpError } from "@/common/errors.ts";
import { dbPool } from "@/db/client.ts";
import { v } from "@/sql/utils.ts";
import { DbExamination } from "@ijia/school-db/db";

type SelectRaw = Pick<DbExamination, "end_time" | "start_time" | "template_id" | "id">;
export async function endExamination(examId: number, userId: number) {
  await using t = dbPool.begin();

  const [exam] = await t.queryRows<SelectRaw>(v.gen`
    WITH exam AS (
      SELECT end_time, start_time, template_id, id
      FROM examination
      WHERE id=${examId} AND user_id=${userId}
      FOR UPDATE
    ), update AS (
      UPDATE examination SET end_time=now()
      FROM exam
      WHERE examination.id=exam.id
      AND examination.end_time IS NULL AND examination.start_time IS NOT NULL
    )
    SELECT * FROM exam`);
  if (!exam) throw new HttpError(404, "考试不存在");
  if (!exam.start_time) throw new HttpError(409, "考试未开始");
  if (exam.end_time) throw new HttpError(409, "考试已结束");

  const templateId = exam.template_id;

  const questionScore = v.gen`WITH q AS (
      SELECT
        a.exam_id, a.index, a.user_answer_select,
        (EXTRACT(EPOCH FROM a.question_commit_time - a.question_start_time) * 1000)::INT AS use_time,
        (CASE 
          WHEN q.time_limit IS NOT NULL AND (EXTRACT(EPOCH FROM a.question_commit_time - a.question_start_time))::SMALLINT > q.time_limit THEN 0
          WHEN q.answer_index=a.user_answer_select THEN q.score
          WHEN q.question_type='multiple_choice' AND q.answer_index @> a.user_answer_select THEN 
            q.score / 2
          ELSE 0
          END
        ) AS score
        FROM examination_user_answer AS a
        LEFT JOIN exam_paper_template_question_view AS q ON q.paper_template_id=${templateId} AND a.index=q.index
        WHERE a.exam_id=${examId} AND a.question_commit_time IS NOT NULL
     ), updateQuestion AS (
      UPDATE examination_user_answer AS a
      SET score=COALESCE(q.score, 0) FROM q WHERE a.exam_id=q.exam_id AND a.index=q.index
     )
     UPDATE examination
      SET
        grade=COALESCE((SELECT SUM(q.score) FROM q), 0),
        effective_time_consumption=COALESCE((SELECT SUM(q.use_time) FROM q), 0)
     WHERE id=${examId} AND user_id=${userId}
     RETURNING grade
    `;

  await t.queryRows<{ grade: number }>(questionScore);

  await t.commit();
}
