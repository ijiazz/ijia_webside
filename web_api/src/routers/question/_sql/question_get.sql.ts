import { dbPool } from "@/db/client.ts";
import { GetUserQuestionListResult, QuestionDetail, QuestionPublic, ReviewStatus } from "@/dto.ts";
import { v } from "@/sql/utils.ts";
import { genQuestionMedias, parseCursorId, toCursor } from "../_utils/question.ts";
import { getQuestionDetailSelect, getQuestionPublicSelect, PublicSelectRaw } from "./select_question.sql.ts";
import { HttpError } from "@/global/errors.ts";

export async function getUserQuestionPublicList(
  config: {
    userId: number | null;
    isOwner?: boolean;
  },
  filters: { cursorNext?: string } = {},
): Promise<GetUserQuestionListResult> {
  const { isOwner, userId } = config;
  const { cursorNext } = filters;
  const limit = 15;
  const cursorNextId = cursorNext ? parseCursorId(cursorNext) : undefined;

  const sql = getQuestionPublicSelect()
    .where(() => {
      const where = [`q.user_id=${v(userId)}`];

      if (!isOwner) {
        where.push(`q.review_status='passed'`);
      }
      if (cursorNextId) {
        where.push(`q.id < ${v(cursorNextId)}`);
      }
      return where;
    })
    .orderBy("q.id DESC")
    .limit(limit);

  const rows = await dbPool.queryRows(sql);
  return {
    items: rows.map(mapQuestion),
    cursor_prev: rows[0] ? toCursor(rows[0].question_id) : null,
    cursor_next: rows.length === limit ? toCursor(rows[rows.length - 1].question_id) : null,
  };
}
function mapQuestion(item: PublicSelectRaw): QuestionPublic {
  const option = genQuestionMedias(item.medias, item.option_text);
  return {
    question_text: item.question_text,
    question_text_struct: item.question_text_struct,
    question_type: item.question_type,
    medias: option.medias,
    options: option.options,

    difficulty_level: item.difficulty_level,
    collection_level: item.collection_level,
    question_id: item.question_id,
    user: item.user,
    comment: item.comment,
  };
}

export async function getQuestionDetail(questionId: number, userId: number | null): Promise<QuestionDetail | null> {
  const sql = getQuestionDetailSelect()
    .where([`q.id = ${questionId}`, `(q.review_status=${v(ReviewStatus.passed)} OR q.user_id = ${v(userId)})`])
    .limit(1);
  const items = await dbPool.queryRows(sql);

  const item = items[0];
  if (!item) {
    return null;
  }

  const publicQuestion = mapQuestion(item) as QuestionDetail;
  publicQuestion.create_time = item.create_time.toISOString();
  publicQuestion.update_time = item.update_time.toISOString();
  if (item.event_time) {
    publicQuestion.event_time = item.event_time.toISOString();
  }
  if (item.long_time !== undefined) {
    publicQuestion.long_time = item.long_time;
  }

  return publicQuestion;
}
