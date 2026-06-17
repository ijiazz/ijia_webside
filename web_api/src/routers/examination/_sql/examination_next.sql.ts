import { HttpError } from "@/common/errors.ts";
import { jsonb_build_object } from "@/common/sql_util.ts";
import { dbPool } from "@/db/client.ts";
import { ExaminationQuestionOutput, QuestionPrivate } from "@/dto.ts";
import { genQuestionMedias } from "@/routers/question/_utils/question.ts";
import { v } from "@/sql/utils.ts";
import { DbExamination } from "@ijia/school-db/db";
import { select } from "@asla/yoursql";
type NextQuestionRow = {
  index: number;
  question_start_time: Date | null;
  question_id: number | null;
  question_text: string | null;
  question_text_struct: QuestionPrivate["question_text_struct"] | null;
  question_type: QuestionPrivate["question_type"];
  options:
    | {
        index: number;
        text: string | null;
        type: string | null;
        data: string | null;
      }[]
    | null;
};
function toQuestionOutput(row: NextQuestionRow): ExaminationQuestionOutput["question"] {
  if (!row.question_id || !row.question_text || !row.question_start_time) {
    throw new HttpError(409, "考试题目不存在");
  }
  const medias = row.options ? genQuestionMedias(row.options) : null;
  return {
    index: row.index,
    start_time: row.question_start_time.toISOString(),
    time_limit: null,
    question_text: row.question_text,
    question_text_struct: row.question_text_struct ?? undefined,
    question_type: row.question_type,
    attachments: medias?.attachments,
    options: medias?.options,
  };
}
function checkAllowGetNext(exam: SelectRaw) {
  if (!exam) throw new HttpError(404, "考试不存在");
  if (exam.end_time || (exam.allow_time_end && new Date() > exam.allow_time_end))
    throw new HttpError(409, "考试已结束");
  if (!exam.start_time) throw new HttpError(409, "考试未开始");
  if (!exam.template_id) throw new HttpError(409, "试卷不存在");
  return exam.template_id;
}
type SelectRaw = Pick<DbExamination, "start_time" | "end_time" | "allow_time_end" | "template_id" | "question_total">;
export async function getNextExaminationQuestion(
  examId: number,
  userId: number,
): Promise<ExaminationQuestionOutput["question"]> {
  const statusQuery = select<SelectRaw>(["start_time", "template_id", "end_time", "allow_time_end", "question_total"])
    .from("examination")
    .where([`id=${v(examId)}`, `user_id=${v(userId)}`]);
  const [exam] = await dbPool.queryRows(statusQuery);
  const templateId = checkAllowGetNext(exam);

  if (!exam.question_total) {
    return null;
  }
  const c = `WITH update AS(${v.gen`
    INSERT INTO examination_user_answer (exam_id, question_start_time, index)
    SELECT 
      ${examId}, now(),
      COALESCE(
        (SELECT MAX(index) + 1 FROM examination_user_answer
          WHERE exam_id=${examId} AND user_answer_select IS NOT NULL
        ),
        0
      ) AS index
    ON CONFLICT (exam_id, index) DO UPDATE
      SET question_start_time=EXCLUDED.question_start_time
    RETURNING question_start_time, index, exam_id`}
  ) ${select([
    "u.index",
    "u.question_start_time",
    "q.id AS question_id",
    "q.question_text",
    "q.question_text_struct",
    "q.question_type",
    select(
      `ARRAY_AGG(${jsonb_build_object({
        index: "m.index",
        text: "m.text",
        type: "m.media_type",
        data: "encode(m.media, 'base64')",
      })})`,
    )
      .from("exam_question_real_option", { as: "m" })
      .where(`m.question_id=q.id`)
      .toSelect("options"),
  ])
    .from("update", { as: "u" })
    .innerJoin("exam_paper_template_question", {
      as: "t",
      on: `t.paper_template_id=${v(templateId)} AND t.index=u.index`,
    })
    .innerJoin("exam_question", { as: "q", on: "q.id=t.question_id" })
    .genSql()}    
`;
  const [row] = await dbPool.queryRows<NextQuestionRow>(c);
  if (!row) {
    return null;
  }
  return toQuestionOutput(row);
}
