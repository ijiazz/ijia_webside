import { dbPool } from "@/db/client.ts";
import { CreateQuestionParam } from "@/dto.ts";
import { insertIntoValues, v } from "@/sql/utils.ts";
import { update } from "@asla/yoursql";
import { DbExamQuestion } from "@ijia/data/db";
import { checkQuestionTypeOption, parserCreateQuestionInput } from "../_utils/create.schema.ts";
import { SqlLike } from "@asla/pg";

export async function createQuestion(
  userId: number,
  input: CreateQuestionParam,
  option: { skipReview?: boolean } = {},
): Promise<number> {
  const { advanced_config } = input;

  const attachmentOptions = parserCreateQuestionInput(input.options, input.attachments);

  const answer_index = input.answer_index.sort((a, b) => a - b);

  checkQuestionTypeOption(input.question_type, input.options?.length ?? 0, answer_index);

  const updateObject = {
    user_id: userId,
    question_text: input.question_text,
    question_text_struct: input.question_text_struct
      ? new String(v(JSON.stringify(input.question_text_struct)))
      : undefined,
    question_type: input.question_type,
    answer_index: answer_index,
    answer_text: input.explanation_text,
    answer_text_struct: input.explanation_text_struct
      ? new String(v(JSON.stringify(input.explanation_text_struct)))
      : undefined,
    event_time: input.event_time,
  } satisfies { [key in keyof DbCreateExamQuestion]?: String | DbCreateExamQuestion[key] };
  if (advanced_config) {
    Object.assign(updateObject, {
      long_time: advanced_config.long_time,
      difficulty_level: advanced_config.difficulty_level,
      collection_level: advanced_config.collection_level,
    });
  }
  if (option.skipReview) {
    //@ts-ignore
    updateObject.review_status = new String("'passed'::review_status");
  }

  const insertQuestionSql = insertIntoValues("exam_question", updateObject).returning<{ id: number }>(["id"]);

  await using t = dbPool.begin();

  const [res] = await t.query([
    insertQuestionSql,
    update("user_profile")
      .set({ exam_question_count: "exam_question_count + 1" })
      .where(`user_id=${v(userId)}`),
  ]);
  const questionId = res.rows![0].id;

  const insertReviewSql: SqlLike[] = [];
  if (!option.skipReview) {
    insertReviewSql.push(v.gen`SELECT review_question_set_to_reviewing(${questionId}) AS id`);
  }

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

  const themes = advanced_config?.themes;
  if (themes?.length) {
    const themesValues = themes.map((theme) => ({ theme_id: theme, question_id: questionId }));
    insertReviewSql.push(insertIntoValues("exam_question_theme_bind", themesValues));
  }
  if (insertReviewSql.length) await t.execute(insertReviewSql);

  await t.commit();
  return questionId;
}

type DbCreateExamQuestion = Pick<
  DbExamQuestion,
  "user_id" | "question_text" | "question_type" | "answer_text" | "answer_index"
> &
  Partial<Pick<DbExamQuestion, "question_text_struct" | "answer_text_struct" | "long_time">> & {
    event_time?: string;
  };
