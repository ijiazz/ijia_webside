import { ExaminationRecordQuestion, QuestionRecordItem } from "@/dto.ts";
import { dbPool } from "@/db/client.ts";
import { v } from "@/sql/utils.ts";
import { select } from "@asla/yoursql";
import { DbExamination } from "@ijia/school-db/db";
import { HttpError } from "@/common/errors.ts";
import { jsonb_build_object } from "@/common/sql_util.ts";
import { initQuestionOptions, QuestionMediaRaw } from "@/routers/question/_utils/question.ts";

export async function getExaminationRecord(examId: number, userId: number): Promise<ExaminationRecordQuestion[]> {
  const examRawSql = select<
    Pick<DbExamination, "template_id" | "end_time" | "result_allow_view_date" | "question_total">
  >(["e.template_id", "e.end_time", "e.result_allow_view_date", "e.question_total"])
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
    "(EXTRACT(EPOCH FROM a.question_commit_time - a.question_start_time) * 1000)::INT AS use_time",
    "a.question_start_time AS start_time",
    select(
      jsonb_build_object({
        question_id: "q.question_id",
        difficulty_level: "q.difficulty_level",
        question_text: "q.question_text",
        question_text_struct: "q.question_text_struct",
        question_type: "q.question_type",
        comment: select(
          jsonb_build_object({
            id: "q.comment_id",
            total: "c.comment_total",
          }),
        )
          .from("comment_tree", { as: "c" })
          .where("c.id=q.comment_id")
          .toSelect(),
        user: select(
          jsonb_build_object({
            user_id: "u.id",
            nickname: "u.nickname",
            avatar_url: "u.avatar",
          }),
        )
          .from("public.user", { as: "u" })
          .where("u.id=q.user_id")
          .toSelect(),
        is_timeout: `COALESCE(q.time_limit IS NOT NULL AND (EXTRACT(EPOCH FROM a.question_commit_time - a.question_start_time))::SMALLINT > q.time_limit, false)`,
        time_limit: "q.time_limit",
        score_total: "q.score",
        answer: jsonb_build_object({
          answer_index: "q.answer_index",
          explanation_text: "q.answer_text",
          explanation_text_struct: "q.answer_text_struct",
        }),
        options: select(
          `ARRAY_AGG(${jsonb_build_object({
            index: "COALESCE(q.option_map[m.index+1], m.index)",
            text: "m.text",
            type: "m.media_type",
            data: "encode(m.media, 'base64')",
          })})`,
        )
          .from("exam_question_real_option", { as: "m" })
          .where(`m.question_id=q.question_id`)
          .toSelect(),
        attachments: select(
          `ARRAY_AGG(${jsonb_build_object({
            index: "m.index",
            text: "m.text",
            type: "m.media_type",
            data: "encode(m.media, 'base64')",
          })})`,
        )
          .from("exam_question_attachment", { as: "m" })
          .where(`m.question_id=q.question_id`)
          .toSelect(),
      }),
    )
      .from("exam_paper_template_question_view", { as: "q" })
      .where([`q.paper_template_id=${v(templateId)}`, `q.index=t.index`])
      .toSelect("question"),
  ])
    .from(`(SELECT generate_series(0, ${exam.question_total - 1}) AS index)`, { as: "t" })
    .leftJoin("examination_user_answer", {
      as: "a",
      on: `a.exam_id=${v(examId)} AND a.index=t.index`,
    })
    .where([`a.exam_id=${v(examId)}`])
    .orderBy("t.index ASC");
  const raw = await dbPool.queryRows<RecordRow>(sql);
  return mapResult(raw, allowsViewResult);
}
function mapResult(input: RecordRow[], allowViewResult: boolean): ExaminationRecordQuestion[] {
  return input.map((row) => {
    let question: QuestionRecordItem | null = null;
    if (row.question) {
      question = {
        question_id: row.question.question_id,
        difficulty_level: row.question.difficulty_level,
        question_text: row.question.question_text,
        question_text_struct: row.question.question_text_struct ?? undefined,
        question_type: row.question.question_type,
        comment: row.question.comment,
        time_limit: row.question.time_limit,
        score_total: row.question.score_total,
        user: row.question.user,
        attachments: row.question.attachments ? initQuestionOptions(row.question.attachments) : undefined,
        options: row.question.options ? initQuestionOptions(row.question.options) : undefined,
      };

      if (allowViewResult) {
        question.answer = {
          answer_index: row.question.answer.answer_index,
          explanation_text: row.question.answer.explanation_text,
          explanation_text_struct: row.question.answer.explanation_text_struct ?? undefined,
        };
      }
    }

    return {
      index: row.index,
      isTimeout: row.question ? row.question.is_timeout : false,
      selected: row.selected,
      score: row.score,
      use_time: row.use_time,
      question,
    };
  });
}
type RecordRow = {
  index: number;
  selected: number[] | null;
  score: number | null;
  use_time: number | null;
  question:
    | (Pick<
        QuestionRecordItem,
        | "question_id"
        | "difficulty_level"
        | "question_text"
        | "question_text_struct"
        | "question_type"
        | "comment"
        | "time_limit"
        | "score_total"
        | "user"
      > & {
        is_timeout: boolean;
        answer: {
          answer_index: number[];
          explanation_text: string;
          explanation_text_struct: QuestionRecordItem["question_text_struct"] | null;
        };
        options: QuestionMediaRaw[] | null;
        attachments: QuestionMediaRaw[] | null;
      })
    | null;
};
