import { dbPool } from "@/db/client.ts";
import { insertIntoValues, v } from "@/sql/utils.ts";
import { update } from "@asla/yoursql";
import { DbExamQuestion } from "@ijia/school-db/db";
import { QuestionParsedOption } from "../_utils/create.schema.ts";
import { SqlLike } from "@asla/pg";

export async function createQuestion(
  data: DbCreateExamQuestion,
  options: {
    themes?: string[];
    attachmentOptions?: QuestionParsedOption[];
  } = {},
) {
  const { themes, attachmentOptions = [] } = options;
  const updateObject = {
    ...data,
    question_text_struct: data.question_text_struct
      ? new String(v(JSON.stringify(data.question_text_struct)))
      : undefined,
    answer_text_struct: data.answer_text_struct ? new String(v(JSON.stringify(data.answer_text_struct))) : undefined,
  } satisfies { [key in keyof DbCreateExamQuestion]: String | DbCreateExamQuestion[key] };

  const insertQuestionSql = insertIntoValues("exam_question", updateObject).returning<{ id: number }>(["id"]);

  await using t = dbPool.begin();

  const [res] = await t.query([
    insertQuestionSql,
    update("user_profile")
      .set({ exam_question_count: "exam_question_count + 1" })
      .where(`user_id=${v(data.user_id)}`),
  ]);
  const questionId = res.rows![0].id;

  const insertReviewSql: SqlLike[] = [];
  insertReviewSql.push(
    v.gen`SELECT review_question_set_to_reviewing(id) FROM exam_question WHERE id=${questionId} AND review_status='pending'`,
  );

  if (attachmentOptions.length > 0) {
    const optionsValues = attachmentOptions.map((media) => {
      const file = media.file;
      return {
        index: media.index,
        text: media.text,
        media_type: file?.type,
        media: file ? new String(`decode(${v(file.data)}, 'base64')`) : undefined,
        question_id: questionId,
      };
    });
    // 先插入题目，获取到题目ID后，再插入媒体
    insertReviewSql.push(insertIntoValues("exam_question_option", optionsValues));
  }

  if (themes?.length) {
    const themesValues = themes.map((theme) => ({ theme_id: theme, question_id: questionId }));
    insertReviewSql.push(insertIntoValues("exam_question_theme_bind", themesValues));
  }
  if (insertReviewSql.length) await t.execute(insertReviewSql);

  await t.commit();
  return questionId;
}

export type DbCreateExamQuestion = Pick<
  DbExamQuestion,
  "user_id" | "question_text" | "question_type" | "answer_text" | "answer_index" | "review_status"
> &
  Partial<
    Pick<
      DbExamQuestion,
      | "question_text_struct"
      | "answer_text_struct"
      | "long_time"
      | "is_system_gen"
      | "difficulty_level"
      | "collection_level"
    >
  > & {
    event_time?: string;
  };
