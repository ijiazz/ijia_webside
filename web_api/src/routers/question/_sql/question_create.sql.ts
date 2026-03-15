import { dbPool } from "@/db/client.ts";
import { CreateQuestionParam, ReviewTargetType } from "@/dto.ts";
import { insertIntoValues, v } from "@/sql/utils.ts";
import { update } from "@asla/yoursql";
import { DbExamQuestion, ReviewStatus } from "@ijia/data/db";
import { checkQuestionOption, parserCreateQuestionInput } from "../_utils/create.schema.ts";

export async function createQuestion(userId: number, input: CreateQuestionParam): Promise<number> {
  const { themes, options, question_medias } = input;

  const { option_text, medias, answerIndex } = parserCreateQuestionInput(options, question_medias);
  checkQuestionOption(input.question_type, option_text, answerIndex);
  const insertQuestionSql = insertIntoValues("exam_question", {
    user_id: userId,
    question_text: input.question_text,
    question_text_struct: input.question_text_struct ?? undefined,
    question_type: input.question_type,
    option_text: option_text,
    answer_index: answerIndex,
    answer_text: input.explanation_text,
    answer_text_struct: input.explanation_text_struct ?? undefined,
    event_time: input.event_time,
    long_time: input.long_time,
  } satisfies DbCreateExamQuestion).returning<{ id: number }>(["id"]);
  const firstInsert: string[] = [insertQuestionSql.genSql()];

  if (medias.length > 0) {
    //TODO: 把临时文件移动到正式位置
    // 先插入题目，获取到题目ID后，再插入媒体
    const insertMediasSql = insertIntoValues(
      "exam_question_media",
      medias.map((media, index) => ({ ...media, question_id: `${index}` })),
    );
    firstInsert.push(insertMediasSql.genSql());
  }
  // 更新用户的题目数量
  firstInsert.push(
    update("user_profile")
      .set({ exam_question_count: "exam_question_count + 1" })
      .where(`user_id=${v(userId)}`)
      .genSql(),
  );

  await using t = dbPool.begin();

  const res = await t.query(firstInsert);
  const questionId = res[0].rows![0].id;

  const insertReviewSql = [
    insertIntoValues("review", {
      target_type: ReviewTargetType.exam_question,
      info: { target_id: questionId },
    })
      .returning<{ id: number }>(["id"])
      .genSql(),
  ];
  if (themes?.length) {
    const insertThemes = insertIntoValues(
      "exam_question_theme_bind",
      themes?.map((theme) => ({ theme_id: theme, question_id: questionId })) ?? [],
    );
    insertReviewSql.push(insertThemes.genSql());
  }

  const res2 = await t.query(insertReviewSql);

  const reviewId: number = res2[0].rows![0].id;

  await t.query(
    update("exam_question")
      .set({ review_id: v(reviewId), review_status: v(ReviewStatus.pending) })
      .where(`id=${v(questionId)}`),
  );

  await t.commit();
  return questionId;
}

type AdminCreateQuestionOption = Pick<DbExamQuestion, "difficulty_level" | "collection_level">;

type DbCreateExamQuestion = Pick<
  DbExamQuestion,
  "user_id" | "question_text" | "question_type" | "option_text" | "answer_text" | "answer_index"
> &
  Partial<Pick<DbExamQuestion, "question_text_struct" | "answer_text_struct" | "long_time">> & {
    event_time?: string;
  };
