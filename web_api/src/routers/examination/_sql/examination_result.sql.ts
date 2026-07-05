import { ExaminationResultOutput } from "@/dto.ts";
import { select } from "@asla/yoursql";
import { dbPool } from "@/db/client.ts";
import { HttpError } from "@/common/errors.ts";
import { DbExamination } from "@ijia/school-db/db";
import { jsonb_build_object } from "@/common/sql_util.ts";
type SelectRaw = Pick<
  DbExamination,
  "grade" | "effective_time_consumption" | "question_total" | "result_allow_view_date"
> & {
  stat: {
    correct_number: number;
    wrong_number: number;
    partially_correct_number: number;
    unanswered_number: number;
  };
};

export async function getExaminationResult(examId: number, userId: number): Promise<ExaminationResultOutput> {
  const [exam] = await dbPool.queryRows<SelectRaw>(
    select([
      "grade",
      "effective_time_consumption",
      "question_total",
      "result_allow_view_date",

      select(
        jsonb_build_object({
          correct_number: "COUNT(1) FILTER(WHERE a.score>0 AND a.score=qb.score)",
          wrong_number: "COUNT(1) FILTER(WHERE a.score=0 AND ARRAY_LENGTH(a.user_answer_select,1) > 0)",
          partially_correct_number: "COUNT(1) FILTER(WHERE a.score>0 AND a.score<qb.score)",
          unanswered_number: "COUNT(1) FILTER(WHERE a.user_answer_select IS NULL OR ARRAY_LENGTH(a.user_answer_select,1) = 0)",
        }),
      )
        .from(`(SELECT generate_series(0, e.question_total - 1) AS index) AS stat`)
        .leftJoin("examination_user_answer", { as: "a", on: `a.exam_id=e.id AND a.index=stat.index` })
        .leftJoin("exam_paper_template_question", {
          as: "qb",
          on: `qb.paper_template_id=e.template_id AND qb.index=stat.index`,
        })
        .toSelect("stat"),
    ])
      .from("examination", { as: "e" })
      .where([
        `id=${examId}`,
        `user_id=${userId}`,
        `(result_allow_view_date IS NULL OR result_allow_view_date<=now())`,
      ]),
  );

  if (!exam) throw new HttpError(404, "考试结果不存在");

  const { stat } = exam;
  return {
    grade: exam.grade ?? 0,
    effective_time_consumption: exam.effective_time_consumption ?? 0,
    correct_number: stat.correct_number,
    wrong_number: stat.wrong_number,
    partially_correct_number: stat.partially_correct_number,
    unanswered_number: stat.unanswered_number,
  };
}
