import { HttpError } from "@/common/errors.ts";
import { dbPool } from "@/db/client.ts";
import { v } from "@/sql/utils.ts";
import { select } from "@asla/yoursql";
import { DbExamination } from "@ijia/school-db/db";

type SelectRaw = Pick<DbExamination, "end_time" | "start_time" | "template_id">;

export async function endExamination(examId: number, userId: number) {
  await using t = dbPool.begin("REPEATABLE READ");
  const [exam] = await t.queryRows<SelectRaw>(
    select(["end_time", "start_time", "template_id"])
      .from("examination")
      .where([`id=${v(examId)}`, `user_id=${v(userId)}`]),
  );
  checkStatus(exam);
  const templateId = exam.template_id;
  if (typeof templateId !== "number") {
    const questionScore = `WITH q AS (
      SELECT
        a.index, a.user_answer_select, a.use_time,
        (CASE WHEN q.answer_index=a.user_answer_select THEN q.score
          WHEN q.question_type='multiple_choice' AND q.answer_index @> a.user_answer_select THEN 
            q.score::REAL / 2
          ELSE 0
          END
        ) AS score
        FROM examination_user_answer AS a
        INNER JOIN exam_paper_template_question_view AS q ON q.paper_template_id=${v(templateId)} AND a.index=q.index
        WHERE a.exam_id=${v(examId)} AND a.user_answer_select IS NOT NULL
     ), total AS (
      SELECT SUM(q.score) AS grade, SUM(COALESCE(q.use_time, 0)) AS use_time_total
      FROM q
     ), updateQuestion AS (
      UPDATE examination_user_answer
      SET score=q.score FROM q
     )
     UPDATE examination
      SET end_time=now(), grade=total.grade,
      use_time_total=COALESCE(total.use_time_total, 0)
     FROM total
     WHERE id=${v(examId)} AND user_id=${v(userId)} AND end_time IS NULL
    `;
    await t.execute(questionScore);
  } else {
    await t.execute(v.gen`
      UPDATE examination
      SET end_time=now(), grade=0, use_time_total=0
      WHERE id=${examId} AND user_id=${userId}
    `);
    return;
  }

  await t.commit();
}

function checkStatus(exam: SelectRaw) {
  if (!exam) throw new HttpError(404, "考试不存在");
  if (exam.end_time) {
    throw new HttpError(409, "考试已结束");
  }
}
