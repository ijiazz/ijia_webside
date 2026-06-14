import { ExaminationResultOutput } from "@/dto.ts";
import { select } from "@asla/yoursql";
import { dbPool } from "@/db/client.ts";
import { HttpError } from "@/common/errors.ts";
import { DbExamination } from "@ijia/school-db/db";
type SelectRaw = Pick<
  DbExamination,
  "grade" | "use_time_total" | "correct_count" | "wrong_count" | "question_total" | "result_allow_view_date"
>;
export async function getExaminationResult(examId: number, userId: number): Promise<ExaminationResultOutput> {
  const [exam] = await dbPool.queryRows<SelectRaw>(
    select(["grade", "use_time_total", "correct_count", "wrong_count", "question_total", "result_allow_view_date"])
      .from("examination", { as: "e" })
      .where([`id=${examId}`, `user_id=${userId}`, `result_allow_view_date IS NULL OR result_allow_view_date<=now()`]),
  );
  if (!exam) throw new HttpError(404, "考试结果不存在");

  const total = exam.question_total ?? 0;
  return {
    grade: exam.grade ?? 0,
    use_time_total: exam.use_time_total,
    correct_number: exam.correct_count,
    wrong_number: exam.wrong_count,
    unanswered_number: Math.max(total - exam.correct_count - exam.wrong_count, 0),
  };
}
