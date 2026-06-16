import { ExaminationRecordQuestion, QuestionRecordItem } from "@/dto.ts";
import { dbPool } from "@/db/client.ts";
import { v } from "@/sql/utils.ts";
import { select } from "@asla/yoursql";
import { DbExamination } from "@ijia/school-db/db";
import { HttpError } from "@/common/errors.ts";

type RecordRow = {
  index: number;
  selected: number[] | null;
  score: number | null;
  use_time: number | null;
  question: Pick<
    QuestionRecordItem,
    | "question_id"
    | "difficulty_level"
    | "question_text"
    | "question_text_struct"
    | "question_type"
    | "options"
    | "attachments"
    | "comment"
    | "user"
  > | null;
};

export async function getExaminationRecord(examId: number, userId: number): Promise<ExaminationRecordQuestion[]> {
  const examRawSql = select<Pick<DbExamination, "template_id" | "end_time" | "result_allow_view_date">>([
    "e.template_id",
    "e.end_time",
    "e.result_allow_view_date",
  ])
    .from("examination", { as: "e" })
    .where([`e.id=${v(examId)}`, `e.user_id=${v(userId)}`]);
  const [exam] = await dbPool.queryRows(examRawSql);
  if (!exam) {
    throw new HttpError(404, "考试不存在");
  }
  const now = new Date();
  if (!exam.end_time) {
    throw new HttpError(409, "考试未结束，不能查看考试记录");
  }
  const allowsViewResult = !exam.result_allow_view_date || exam.result_allow_view_date.getTime() <= now.getTime();

  if (!exam.template_id) {
    return [];
  }
  const templateId: number = exam.template_id;
  const sql = select([
    "t.index",
    "a.user_answer_select AS selected",
    "a.score",
    "a.use_time",
    "a.start_time",
    select([
      "q.id AS question_id",
      "q.difficulty_level",

      "q.question_text",
      "q.question_text_struct",
      "q.question_type",
      "NULL AS options", //TODO
      "NULL AS attachments", //TODO
      "NULL AS comment", //TODO
      "NULL AS user", //TODO
      // "qb.time_limit", //TODO
      "NULL AS answer", //TODO
    ])
      .from("exam_paper_template_question", { as: "qb" })
      .leftJoin("exam_question", { as: "q", on: "q.id=qb.question_id" })
      .where([`qb.paper_template_id=${v(templateId)}`, `qb.index=t.index`])
      .toSelect("question"),
  ])
    .from("(SELECT generate_series(0, 10) AS index)", { as: "t" })
    .leftJoin("examination_user_answer", {
      as: "a",
      on: `a.exam_id=${v(examId)} AND a.index=t.index`,
    })
    .where([`a.exam_id=${v(examId)}`])
    .orderBy("t.index ASC");
  const raw = await dbPool.queryRows<RecordRow>(sql);
  return raw;
}
