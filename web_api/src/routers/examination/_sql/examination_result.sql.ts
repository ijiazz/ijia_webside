import { ExaminationResultOutput } from "@/dto.ts";
import { select } from "@asla/yoursql";
import { dbPool } from "@/db/client.ts";
import { HttpError } from "@/common/errors.ts";
import { DbExamination } from "@ijia/school-db/db";
type SelectRaw = Pick<DbExamination, "grade" | "use_time_total" | "question_total" | "result_allow_view_date">;
export async function getExaminationResult(examId: number, userId: number): Promise<ExaminationResultOutput> {
  const [exam] = await dbPool.queryRows<SelectRaw>(
    select(["grade", "use_time_total", "question_total", "result_allow_view_date"])
      .from("examination", { as: "e" })
      .where([`id=${examId}`, `user_id=${userId}`, `result_allow_view_date IS NULL OR result_allow_view_date<=now()`]),
  );
  if (!exam) throw new HttpError(404, "考试结果不存在");

  const total = exam.question_total ?? 0;
  const correct_number = 0;
  const wrong_number = 0;
  const partially_correct_number = 0;
  const unanswered_number = Math.max(total - correct_number - wrong_number - partially_correct_number, 0);
  return {
    grade: exam.grade ?? 0,
    use_time_total: exam.use_time_total,
    correct_number: correct_number,
    wrong_number: wrong_number,
    partially_correct_number: partially_correct_number,
    unanswered_number: unanswered_number,
  };
}
