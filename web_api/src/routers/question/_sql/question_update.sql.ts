import { ExamQuestionType, QuestionAttachment, UpdateQuestionParam } from "@/dto.ts";
import { QuestionAdvancedConfig, checkQuestionTypeOption, parserCreateQuestionInput } from "../_utils/create.schema.ts";
import { insertIntoValues, v } from "@/sql/utils.ts";
import { select, update } from "@asla/yoursql";
import { HttpError } from "@/global/errors.ts";
import { DbTransaction, SqlLike } from "@asla/pg";
import { DbExamQuestion, ReviewStatus } from "@ijia/data/db";
import { dbPool } from "@/db/client.ts";
type UpdateReturn = {
  id: number;
  answer_index: number[];
  question_type: ExamQuestionType;
  option_count: number;
};

const UpdateSelect = [
  "id",
  "answer_index",
  "question_type",
  "(SELECT count(*) FROM exam_question_option WHERE question_id=exam_question.id AND index >=0) AS option_count",
];

export async function updateQuestion(questionId: number, userId: number, input: UpdateQuestionParam) {
  await using t = dbPool.begin("REPEATABLE READ");

  await internalUpdateQuestion(
    t,
    async () => {
      const [row] = await t.queryRows<UpdateReturn>(
        select(UpdateSelect)
          .from("exam_question")
          .where([`id=${v(questionId)}`, `user_id=${v(userId)}`, `review_status IN ('pending', 'rejected')`]),
      );
      if (!row) throw new HttpError(400, "修改失败，可能原因有：1.题目不存 2.题目当前状态不支持修改 3.没有权限修改");
      return row;
    },
    questionId,
    input,
  );

  await t.execute(v.gen`SELECT review_question_set_to_reviewing(${questionId})`);
  await t.commit();
}
export async function updateQuestionForReview(t: DbTransaction, questionId: number, input: UpdateQuestionParam) {
  await internalUpdateQuestion(
    t,
    async () => {
      const [row] = await t.queryRows<UpdateReturn>(
        select(UpdateSelect)
          .from("exam_question")
          .where([`id=${v(questionId)}`]),
      );
      return row;
    },
    questionId,
    input,
  );
}

async function internalUpdateQuestion(
  t: DbTransaction,
  getQuestion: () => Promise<UpdateReturn>,
  questionId: number,
  input: UpdateQuestionParam,
) {
  const row = await getQuestion();

  if (input.options || input.answer_index) {
    // 如果 修改了答案，需要确保有足够选项
    checkQuestionTypeOption(
      row.question_type,
      input.options ? input.options.length : row.option_count,
      input.answer_index ?? row.answer_index,
    );
  }

  const updateValues = genUpdateQuestionObject(input);
  const SQL_LIST: SqlLike[] = [];

  if (updateValues) {
    const sqlUpdate = update("exam_question")
      .set(updateValues as Record<string, string>)
      .where([`id=${v(questionId)}`])
      .returning<UpdateReturn>(UpdateSelect);
    SQL_LIST.push(sqlUpdate);
  }

  const updateOptions = genUpdateOptionSQL(questionId, input.options, input.attachments);
  SQL_LIST.push(...updateOptions);
  if (SQL_LIST.length === 0) {
    return;
  }
  await t.execute(SQL_LIST);
}
export async function updateQuestionAdvanceConfig(
  t: DbTransaction,
  questionId: number,
  advanced_config?: QuestionAdvancedConfig,
  reviewStatus?: ReviewStatus,
) {
  const SQL_LIST: SqlLike[] = [];
  let updateValues = undefined;
  if (advanced_config) {
    updateValues = genUpdateAdvancedConfigObject(advanced_config);
  }
  if (reviewStatus) {
    const sqlValue = `(${v(reviewStatus)}::review_status)`;
    if (updateValues) {
      updateValues.review_status = sqlValue;
    } else {
      updateValues = { review_status: sqlValue };
    }
  }
  if (updateValues) {
    const sqlUpdate = update("exam_question")
      .set(updateValues as Record<string, string>)
      .where([`id=${v(questionId)}`]);
    SQL_LIST.push(sqlUpdate);
  }
  if (advanced_config?.themes) {
    const themes = advanced_config.themes;
    const deleteThemeSql = v.gen`DELETE FROM exam_question_theme WHERE question_id=${questionId}`;
    const sqlInsertTheme = insertIntoValues(
      "exam_question_theme_bind",
      themes.map((theme) => ({ theme_id: theme, question_id: questionId })),
    );
    SQL_LIST.push(deleteThemeSql, sqlInsertTheme);
  }
  if (SQL_LIST.length === 0) {
    return;
  }
  await t.execute(SQL_LIST);
}

function genUpdateOptionSQL(
  questionId: number,
  inputOptions?: QuestionAttachment[],
  inputAttachments?: QuestionAttachment[],
): SqlLike[] {
  if (!inputOptions && !inputAttachments) {
    return [];
  }
  const options = parserCreateQuestionInput(inputOptions, inputAttachments);
  const insertValues = options.map((option) => ({
    question_id: v(questionId),
    text: option.text,
    media_type: option.file?.type,
    media: option.file ? new String(`decode(${v(option.file.data)}, 'base64')`) : undefined,
    index: option.index,
  }));
  const insert = insertIntoValues("exam_question_option", insertValues);

  let deletes: SqlLike | undefined;
  if (inputOptions && inputAttachments) {
    // 如果同时更新选项和附件，直接删除原有的选项，重新插入
    deletes = v.gen`DELETE FROM exam_question_option WHERE question_id=${questionId}`;
  } else if (inputOptions) {
    // 只更新选项，删除原有的选项文本，保留附件
    deletes = v.gen`DELETE FROM exam_question_option WHERE question_id=${questionId} AND index >= 0`;
  } else if (inputAttachments) {
    // 只更新附件，保留选项文本，但删除原有的附件
    deletes = v.gen`DELETE FROM exam_question_option WHERE question_id=${questionId} AND index < 0`;
  }
  return deletes ? [deletes, insert] : [insert];
}

function genUpdateQuestionObject(input: UpdateQuestionParam = {}) {
  let keys = 0;
  const updateValues: { [key in keyof DbExamQuestion]?: string | String } = {};

  if (input.answer_index) {
    if (input.answer_index.length === 0) {
      throw new HttpError(400, "答案不能为空");
    }
    updateValues.answer_index = v(input.answer_index);
    keys++;
  }
  if (input.question_text !== undefined) {
    updateValues.question_text = v(input.question_text);
    keys++;
  }
  if (input.question_text_struct !== undefined) {
    updateValues.question_text_struct = new String(v(JSON.stringify(input.question_text_struct)));
    keys++;
  }
  if (input.explanation_text !== undefined) {
    updateValues.answer_text = v(input.explanation_text);
    keys++;
  }
  if (input.explanation_text_struct !== undefined) {
    updateValues.answer_text_struct = new String(v(JSON.stringify(input.explanation_text_struct)));
    keys++;
  }
  if (input.event_time !== undefined) {
    updateValues.event_time = v(input.event_time);
    keys++;
  }

  if (keys === 0) {
    return undefined;
  }

  return updateValues;
}

function genUpdateAdvancedConfigObject(advanced_config: Partial<QuestionAdvancedConfig>) {
  let keys = 0;
  const updateValues: { [key in keyof DbExamQuestion]?: string | String } = {};
  if (advanced_config.long_time !== undefined) {
    updateValues.long_time = v(advanced_config.long_time);
    keys++;
  }
  if (advanced_config.difficulty_level !== undefined) {
    updateValues.difficulty_level = v(advanced_config.difficulty_level);
    keys++;
  }
  if (advanced_config.collection_level !== undefined) {
    updateValues.collection_level = v(advanced_config.collection_level);
    keys++;
  }
  if (keys === 0) {
    return undefined;
  }
  return updateValues;
}
