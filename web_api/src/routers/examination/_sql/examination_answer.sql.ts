import { HttpError } from "@/common/errors.ts";
import { ExaminationAnswerInput, ExamQuestionType } from "@/dto.ts";
import { dbPool } from "@/db/client.ts";
import { v } from "@/sql/utils.ts";
import { select } from "@asla/yoursql";
import { DbExamination } from "@ijia/school-db/db";
type SelectRaw = Pick<DbExamination, "allow_time_start" | "allow_time_end" | "end_time" | "template_id">;
export async function submitExaminationAnswer(examId: number, userId: number, input: ExaminationAnswerInput) {
  await using t = dbPool.begin("REPEATABLE READ");
  const [exam] = await t.queryRows(
    select<SelectRaw>(["allow_time_start", "allow_time_end", "end_time", "template_id"])
      .from("examination")
      .where([`id=${v(examId)}`, `user_id=${v(userId)}`])
      .limit(1),
  );
  const templateId = checkExamStatus(exam);
  const [question] = await t.queryRows<{ option_total: number; question_type: ExamQuestionType }>(v.gen`
    SELECT
      q.question_type, 
      (SELECT count(*)::INT FROM exam_question_real_option o WHERE o.question_id=qb.question_id) AS option_total
    FROM exam_paper_template_question qb INNER JOIN exam_question q ON qb.question_id=q.id
    WHERE paper_template_id=${templateId} AND index=${input.index}
    LIMIT 1
  `);
  if (!question) {
    throw new HttpError(409, "题目不存在");
  }

  const answer = input.answer.sort((a, b) => a - b);
  checkQuestionAnswer(question.question_type, answer);
  if (answer.length) {
    if (answer[0] < 0) throw new HttpError(400, "选择的答案索引必须大于或等于0");
    if (answer[answer.length - 1] >= question.option_total) throw new HttpError(400, `选择答案不能超过选项数量`);
  }

  const count = await t.queryCount(v.gen`
    UPDATE examination_user_answer AS a
    SET user_answer_select=${answer}, use_time=(EXTRACT(EPOCH FROM now() - a.start_time) * 1000)::INT
    WHERE exam_id=${examId} AND index=${input.index} AND a.start_time IS NOT NULL AND user_answer_select IS NULL
  `);
  if (count === 0) {
    throw new HttpError(409, "题目已提交作答");
  }
  await t.commit();
}
function checkExamStatus(exam?: SelectRaw) {
  if (!exam) throw new HttpError(404, "考试不存在");
  if (exam.end_time || (exam.allow_time_end && exam.allow_time_end.getTime() < Date.now())) {
    throw new HttpError(409, "考试已结束");
  }
  if (exam.allow_time_start && exam.allow_time_start.getTime() > Date.now()) {
    throw new HttpError(409, "未到考试开始时间");
  }
  const templateId = exam.template_id;
  if (typeof templateId !== "number") {
    throw new HttpError(409, "找不到试卷模板");
  }
  return templateId;
}
function checkQuestionAnswer(questionType: ExamQuestionType, answer: number[]) {
  switch (questionType) {
    case ExamQuestionType.SingleChoice:
      if (answer.length !== 1) {
        throw new HttpError(400, "单选题只能选择一个答案");
      }
      break;
    case ExamQuestionType.MultipleChoice:
      if (answer.length === 0) {
        throw new HttpError(400, "多选题至少选择一个答案");
      }
      break;
    case ExamQuestionType.TrueOrFalse:
      if (answer.length !== 1 || (answer[0] !== 0 && answer[0] !== 1)) {
        throw new HttpError(400, "判断题只能选择 0 或 1");
      }
      break;

    default:
      break;
  }
}
