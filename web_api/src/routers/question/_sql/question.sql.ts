import { dbPool } from "@/db/client.ts";
import { HttpError } from "@/global/errors.ts";
import { insertIntoValues, v } from "@/sql/utils.ts";
import { checkTypeCopy, CheckTypeError, getBasicType, integer, optional, TypeCheckFn } from "@asla/wokao";
import type { ExamQuestionReviewItem, ExamQuestionType, GetQuestionReviewNextResult } from "@/dto.ts";
import { ReviewStatus, TextStructure } from "@ijia/data/db";
import { deleteFrom, update } from "@asla/yoursql";
import { TEXT_STRUCT_SCHEMA } from "@/global/schema.ts";

type QuestionOptionItem = {
  text: string;
};

type QuestionRow = {
  id: number;
  question_text: string;
  question_text_struct: TextStructure[] | null;
  question_type: ExamQuestionType;
  option_text: string[] | null;
  answer_index: number[];
  answer_text: string | null;
  answer_text_struct: TextStructure[] | null;
  difficulty_level: number;
  collection_level: number;
  event_time: Date | null;
  long_time: boolean;
  create_time: Date;
  update_time: Date;
  user_id: number | null;
  nickname: string | null;
  avatar: string | null;
  comment_id: number | null;
  comment_total: number;
  review_status: ReviewStatus | null;
  resolved_time: Date | null;
  review_comment: string | null;
  review_id: number | null;
  pass_count: number;
  reject_count: number;
  is_system_gen: boolean;
};

type QuestionDraft = {
  question_text: string;
  question_text_struct: TextStructure[] | null;
  question_type: ExamQuestionType;
  option_text: string[] | null;
  answer_index: number[];
  answer_text: string;
  answer_text_struct: TextStructure[] | null;
  event_time: Date | null;
  long_time: boolean;
};

type QuestionCreateInput = QuestionDraft & {
  themes?: string[];
};

type QuestionUpdateInput = Partial<QuestionCreateInput> & {
  question_id?: string;
};

type ReviewQuestionPayload = {
  question_text: string;
  question_text_struct: TextStructure[] | null;
  question_type: ExamQuestionType;
  options: string[] | null;
  answer_index: number[];
  answer_text: string;
  answer_text_struct: TextStructure[] | null;
  event_time: string | null;
  long_time: boolean;
  create_time: string;
  update_time: string;
};

type StoredQuestionReviewPayload = {
  target_id: number;
  question: ReviewQuestionPayload;
};

type QuestionReviewRow = {
  review_id: number;
  info: StoredQuestionReviewPayload | string;
  pass_count: number;
  reject_count: number;
};

type QuestionQueryable = {
  queryCount(sql: unknown): Promise<number>;
  queryRows<T>(sql: unknown): Promise<T[]>;
};

const questionTypeChecker: TypeCheckFn<ExamQuestionType> = (input) => {
  if (typeof input !== "string") {
    throw new CheckTypeError("string", typeof input);
  }
  switch (input) {
    case "single_choice":
    case "multiple_choice":
    case "true_false":
      return input as ExamQuestionType;
    default:
      throw new CheckTypeError("single_choice|multiple_choice|true_false", input);
  }
};

const stringArrayChecker: TypeCheckFn<string[] | null> = (input) => {
  if (!(input instanceof Array)) {
    throw new CheckTypeError("Array", getBasicType(input));
  }
  return input.map((item, index) => {
    if (typeof item !== "string") {
      throw new CheckTypeError({ [index]: "必须是字符串" });
    }
    return item;
  });
};

const intArrayChecker: TypeCheckFn<number[]> = (input) => {
  if (!(input instanceof Array)) {
    throw new CheckTypeError("Array", getBasicType(input));
  }
  return input.map((item, index) => {
    if (!Number.isInteger(item)) {
      throw new CheckTypeError({ [index]: "必须是整数" });
    }
    return item;
  });
};

function normalizeThemes(themes?: string[] | null) {
  if (!themes?.length) return undefined;
  const list = themes.map((item) => item.trim()).filter(Boolean);
  return list.length ? Array.from(new Set(list)) : undefined;
}

function ensureTextStructInRange(text: string, struct?: TextStructure[] | null) {
  if (!struct?.length) return;
  const last = struct[struct.length - 1];
  if (last.index + last.length > text.length) {
    throw new HttpError(400, "文本结构索引超出范围");
  }
}

function normalizeOptions(optionText?: string[] | null, questionType?: ExamQuestionType) {
  if (optionText && optionText.length > 0) {
    return optionText.map((item) => item.trim());
  }
  if (questionType === "true_false") {
    return ["正确", "错误"];
  }
  return null;
}

function validateQuestionDraft(input: QuestionDraft): QuestionDraft {
  const questionText = input.question_text.trim();
  if (!questionText) {
    throw new HttpError(400, "question_text 不能为空");
  }
  if (questionText.length > 10000) {
    throw new HttpError(400, "question_text 不能超过10000个字符");
  }
  ensureTextStructInRange(questionText, input.question_text_struct);

  const optionText = normalizeOptions(input.option_text, input.question_type);
  if (!optionText?.length) {
    throw new HttpError(400, "options 不能为空");
  }

  const answerIndex = Array.from(new Set(input.answer_index)).sort((a, b) => a - b);
  if (answerIndex.length === 0) {
    throw new HttpError(400, "answer_index 不能为空");
  }
  if (input.question_type !== "multiple_choice" && answerIndex.length !== 1) {
    throw new HttpError(400, "当前题型只允许一个正确答案");
  }
  const outOfRange = answerIndex.some((item) => item < 0 || item >= optionText.length);
  if (outOfRange) {
    throw new HttpError(400, "answer_index 超出 options 范围");
  }

  const answerText = input.answer_text.trim();
  if (answerText.length > 10000) {
    throw new HttpError(400, "explanation_text 不能超过10000个字符");
  }
  ensureTextStructInRange(answerText, input.answer_text_struct);

  return {
    ...input,
    question_text: questionText,
    option_text: optionText,
    answer_index: answerIndex,
    answer_text: answerText,
  };
}

function normalizeUpdateInput(input: unknown): QuestionUpdateInput {
  try {
    const data = checkTypeCopy(
      input,
      {
        question_id: optional.string,
        question_text: optional.string,
        question_text_struct: optional(TEXT_STRUCT_SCHEMA, "nullish"),
        question_type: optional(questionTypeChecker),
        options: optional(stringArrayChecker, "nullish"),
        answer_index: optional(intArrayChecker),
        explanation_text: optional.string,
        explanation_text_struct: optional(TEXT_STRUCT_SCHEMA, "nullish"),
        event_time: optional(integer(), "nullish"),
        long_time: optional.boolean,
        themes: optional(stringArrayChecker, "nullish"),
      },
      { policy: "pass" },
    );
    const next: QuestionUpdateInput = {
      question_id: data.question_id,
      question_text: data.question_text,
      question_text_struct: data.question_text_struct === undefined ? undefined : (data.question_text_struct ?? null),
      question_type: data.question_type,
      option_text: data.options === undefined ? undefined : (data.options ?? null),
      answer_index: data.answer_index,
      answer_text: data.explanation_text,
      answer_text_struct:
        data.explanation_text_struct === undefined ? undefined : (data.explanation_text_struct ?? null),
      event_time:
        data.event_time === undefined ? undefined : data.event_time === null ? null : new Date(data.event_time),
      long_time: data.long_time,
      themes: normalizeThemes(data.themes ?? undefined),
    };
    const hasUpdate = Object.entries(next).some(([key, value]) => key !== "question_id" && value !== undefined);
    if (!hasUpdate) {
      throw new HttpError(400, "缺少可更新字段");
    }
    return next;
  } catch (error) {
    if (error instanceof CheckTypeError) {
      throw new HttpError(400, error.message);
    }
    throw error;
  }
}

function getBaseQuestionSelect() {
  return `
    SELECT
      q.id,
      q.question_text,
      q.question_text_struct,
      q.question_type,
      q.option_text,
      q.answer_index,
      q.answer_text,
      q.answer_text_struct,
      q.difficulty_level,
      q.collection_level,
      q.event_time,
      q.long_time,
      q.create_time,
      q.update_time,
      q.user_id,
      u.nickname,
      u.avatar,
      q.comment_id,
      COALESCE((SELECT COUNT(*)::INT FROM comment AS c WHERE c.comment_tree_id = q.comment_id AND NOT c.is_delete), 0) AS comment_total,
      q.review_status,
      r.resolved_time,
      r.comment AS review_comment,
      q.review_id,
      COALESCE(r.pass_count, 0) AS pass_count,
      COALESCE(r.reject_count, 0) AS reject_count,
      q.is_system_gen
    FROM exam_question AS q
    LEFT JOIN public.user AS u ON u.id = q.user_id
    LEFT JOIN review AS r ON r.id = q.review_id
  `;
}

function toSqlJson(value: unknown) {
  if (value === null || value === undefined) return null;
  return new String(v(JSON.stringify(value)));
}

function toSqlJsonExpr(value: unknown) {
  if (value === null || value === undefined) return "NULL";
  return String(toSqlJson(value));
}

function toSqlTextArray(value?: string[] | null) {
  if (value === undefined) return undefined;
  if (value === null) return "NULL";
  if (value.length === 0) return "ARRAY[]::VARCHAR[]";
  return `ARRAY[${value.map((item) => v(item)).join(", ")}]::VARCHAR[]`;
}

function toSqlSmallIntArray(value?: number[] | null) {
  if (value === undefined) return undefined;
  if (value === null) return "NULL";
  if (value.length === 0) return "ARRAY[]::SMALLINT[]";
  return `ARRAY[${value.map((item) => v(item)).join(", ")}]::SMALLINT[]`;
}

function toReviewPayload(
  question: QuestionDraft,
  createTime: Date,
  updateTime: Date,
): StoredQuestionReviewPayload["question"] {
  return {
    question_text: question.question_text,
    question_text_struct: question.question_text_struct,
    question_type: question.question_type,
    options: question.option_text,
    answer_index: question.answer_index,
    answer_text: question.answer_text,
    answer_text_struct: question.answer_text_struct,
    event_time: question.event_time?.toISOString() ?? null,
    long_time: question.long_time,
    create_time: createTime.toISOString(),
    update_time: updateTime.toISOString(),
  };
}

function parseStoredPayload(input: StoredQuestionReviewPayload | string): StoredQuestionReviewPayload {
  const data = typeof input === "string" ? JSON.parse(input) : input;
  if (!data || typeof data !== "object") {
    throw new HttpError(500, "review info 数据格式错误");
  }
  return data;
}

function payloadQuestionToDraft(payload: StoredQuestionReviewPayload["question"]): QuestionDraft {
  return validateQuestionDraft({
    question_text: payload.question_text,
    question_text_struct: payload.question_text_struct ?? null,
    question_type: payload.question_type,
    option_text: payload.options ?? null,
    answer_index: payload.answer_index,
    answer_text: payload.answer_text,
    answer_text_struct: payload.answer_text_struct ?? null,
    event_time: payload.event_time ? new Date(payload.event_time) : null,
    long_time: payload.long_time ?? false,
  });
}

function mergeQuestionDraft(base: QuestionDraft, patch: QuestionUpdateInput): QuestionDraft {
  return validateQuestionDraft({
    question_text: patch.question_text ?? base.question_text,
    question_text_struct:
      patch.question_text_struct === undefined ? base.question_text_struct : patch.question_text_struct,
    question_type: patch.question_type ?? base.question_type,
    option_text: patch.option_text === undefined ? base.option_text : patch.option_text,
    answer_index: patch.answer_index ?? base.answer_index,
    answer_text: patch.answer_text ?? base.answer_text,
    answer_text_struct: patch.answer_text_struct === undefined ? base.answer_text_struct : patch.answer_text_struct,
    event_time: patch.event_time === undefined ? base.event_time : patch.event_time,
    long_time: patch.long_time ?? base.long_time,
  });
}

function mapQuestionOptions(optionText: string[] | null): QuestionOptionItem[] | undefined {
  if (!optionText?.length) return undefined;
  return optionText.map((text) => ({ text })) as any;
}

function mapReviewItem(payload: StoredQuestionReviewPayload["question"]): ExamQuestionReviewItem {
  return {
    medias: [],
    question_text: payload.question_text,
    question_text_struct: payload.question_text_struct ?? undefined,
    question_type: payload.question_type,
    options: mapQuestionOptions(payload.options),
    answer_index: payload.answer_index,
    answer_text: payload.answer_text,
    answer_text_struct: payload.answer_text_struct ?? undefined,
    event_time: payload.event_time ?? undefined,
    long_time: payload.long_time,
    create_time: payload.create_time,
    update_time: payload.update_time,
  };
}

async function deleteQuestionReviewIfExists(queryable: QuestionQueryable, reviewId?: number | null) {
  if (!reviewId) return;
  await queryable.queryCount(deleteFrom("review").where(`id=${v(reviewId)}`));
}

async function createQuestionReview(
  queryable: QuestionQueryable,
  questionId: number,
  reviewQuestion: StoredQuestionReviewPayload["question"],
) {
  const payload: StoredQuestionReviewPayload = { target_id: questionId, question: reviewQuestion };
  const [reviewRow] = await queryable.queryRows<{ id: number }>(
    insertIntoValues("review", {
      target_type: new String(`'question'::review_target_type`),
      info: toSqlJson(payload),
      review_display: null,
    }).returning(["id"]),
  );
  if (!reviewRow) {
    throw new HttpError(500, "创建审核项失败");
  }
  return reviewRow.id;
}

async function syncQuestionThemes(queryable: QuestionQueryable, questionId: number, themes?: string[]) {
  if (themes === undefined) return;
  await queryable.queryCount(deleteFrom("exam_question_theme_bind").where(`question_id=${v(questionId)}`));
  if (!themes.length) return;
  await queryable.queryCount(
    insertIntoValues(
      "exam_question_theme_bind",
      themes.map((themeId) => ({ theme_id: themeId, question_id: questionId })),
    ),
  );
}

async function getOwnedQuestionForWrite(questionId: number, userId: number) {
  const [row] = await dbPool.queryRows<QuestionRow>(
    `${getBaseQuestionSelect()} WHERE q.id=${v(questionId)} AND q.user_id=${v(userId)} LIMIT 1`,
  );
  if (!row) {
    throw new HttpError(404, "题目不存在");
  }
  return row;
}

function rowToDraft(row: QuestionRow): QuestionDraft {
  return {
    question_text: row.question_text,
    question_text_struct: row.question_text_struct,
    question_type: row.question_type,
    option_text: row.option_text,
    answer_index: row.answer_index,
    answer_text: row.answer_text ?? "",
    answer_text_struct: row.answer_text_struct,
    event_time: row.event_time,
    long_time: row.long_time,
  };
}

export async function updateQuestion(questionId: number, userId: number, input: unknown) {
  const patch = normalizeUpdateInput(input);
  const current = await getOwnedQuestionForWrite(questionId, userId);
  const currentDraft = rowToDraft(current);
  const nextUpdateTime = new Date();
  const merged = mergeQuestionDraft(currentDraft, patch);
  const reviewQuestion = toReviewPayload(merged, current.create_time, nextUpdateTime);

  await using transaction = dbPool.begin();
  await deleteQuestionReviewIfExists(transaction, current.review_id);
  const reviewId = await createQuestionReview(transaction, questionId, reviewQuestion);
  await transaction.queryCount(
    update("exam_question")
      .set({
        review_id: `${v(reviewId)}`,
        review_status: `'pending'::review_status`,
      })
      .where(`id=${v(questionId)}`),
  );
  await transaction.queryCount(
    update("public.post")
      .set({
        review_id: `${v(reviewId)}`,
        review_status: `'pending'::review_status`,
      })
      .where(`id=${v(questionId)}`),
  );
  await syncQuestionThemes(transaction, questionId, patch.themes);
  await transaction.commit();
}

export async function getQuestionPublicStats() {
  const row = await dbPool.queryFirstRow<{ reviewing_count: number; total_count: number }>(`
    SELECT
      COUNT(*) FILTER (WHERE review_status='pending'::review_status AND NOT is_system_gen)::INT AS reviewing_count,
      COUNT(*) FILTER (WHERE NOT is_system_gen)::INT AS total_count
    FROM exam_question
  `);
  return row;
}

export async function getNextQuestionReview(): Promise<GetQuestionReviewNextResult> {
  const [row] = await dbPool.queryRows<QuestionReviewRow>(`
    SELECT
      r.id AS review_id,
      r.info,
      r.pass_count,
      r.reject_count
    FROM review AS r
    INNER JOIN exam_question AS q ON q.review_id = r.id
    WHERE r.target_type='question'::review_target_type
      AND r.is_passed IS NULL
      AND q.review_status='pending'::review_status
    ORDER BY r.create_time ASC, r.id ASC
    LIMIT 1
  `);
  if (!row) {
    return {
      can_update_question: false,
    };
  }
  const payload = parseStoredPayload(row.info);
  return {
    review_id: row.review_id.toString(),
    question_id: payload.target_id.toString(),
    item: mapReviewItem(payload.question),
    can_update_question: true,
    pass_count: row.pass_count,
    reject_count: row.reject_count,
  };
}

export async function commitQuestionReview(reviewId: number, reviewerId: number, input: unknown) {
  let body: {
    is_passed: boolean;
    remark?: string;
    update?: unknown;
  };
  try {
    body = checkTypeCopy(
      input,
      {
        is_passed: "boolean",
        remark: optional.string,
        update: optional((value) => value),
      },
      { policy: "pass" },
    );
  } catch (error) {
    if (error instanceof CheckTypeError) {
      throw new HttpError(400, error.message);
    }
    throw error;
  }
  const updatePayload = body.update === undefined ? undefined : normalizeUpdateInput(body.update);

  await using transaction = dbPool.begin();
  const [reviewRow] = await transaction.queryRows<{
    question_id: number;
    review_id: number;
    info: StoredQuestionReviewPayload | string;
    create_time: Date;
    review_status: ReviewStatus | null;
  }>(`
    SELECT
      q.id AS question_id,
      r.id AS review_id,
      r.info,
      q.create_time,
      q.review_status
    FROM review AS r
    INNER JOIN exam_question AS q ON q.review_id = r.id
    WHERE r.id=${v(reviewId)}
      AND r.target_type='question'::review_target_type
      AND r.is_passed IS NULL
      AND q.review_status='pending'::review_status
    LIMIT 1
  `);
  if (!reviewRow) {
    throw new HttpError(400, "审核项不存在或已被处理");
  }

  const stored = parseStoredPayload(reviewRow.info);
  let finalDraft = payloadQuestionToDraft(stored.question);
  let finalReviewQuestion = stored.question;
  if (updatePayload) {
    const nextUpdateTime = new Date();
    finalDraft = mergeQuestionDraft(finalDraft, updatePayload);
    finalReviewQuestion = toReviewPayload(finalDraft, new Date(stored.question.create_time), nextUpdateTime);
  }

  const [approved] = await transaction.queryRows<{ id: number }>(`
    UPDATE review
    SET
      is_passed=${v(body.is_passed)},
      resolved_time=NOW(),
      reviewer_id=${v(reviewerId)},
      comment=${v(body.remark ?? null)},
      info=${toSqlJson({ ...stored, question: finalReviewQuestion })},
      pass_count = CASE WHEN ${v(body.is_passed)} THEN pass_count + 1 ELSE pass_count END,
      reject_count = CASE WHEN NOT ${v(body.is_passed)} THEN reject_count + 1 ELSE reject_count END
    WHERE id=${v(reviewId)}
      AND target_type='question'::review_target_type
      AND is_passed IS NULL
    RETURNING id
  `);
  if (!approved) {
    throw new HttpError(400, "审核项不存在或已被处理");
  }

  if (body.is_passed) {
    await transaction.queryCount(
      update("exam_question")
        .set({
          question_text: v(finalDraft.question_text),
          question_text_struct: toSqlJsonExpr(finalDraft.question_text_struct),
          question_type: v(finalDraft.question_type),
          option_text: toSqlTextArray(finalDraft.option_text)!,
          answer_index: toSqlSmallIntArray(finalDraft.answer_index)!,
          answer_text: v(finalDraft.answer_text),
          answer_text_struct: toSqlJsonExpr(finalDraft.answer_text_struct),
          event_time: finalDraft.event_time ? v(finalDraft.event_time) : "NULL",
          long_time: v(finalDraft.long_time),
          update_time: "NOW()",
          public_time: "NOW()",
          review_status: `'passed'::review_status`,
          review_id: `${v(reviewId)}`,
        })
        .where(`id=${v(reviewRow.question_id)}`),
    );
    await transaction.queryCount(
      update("public.post")
        .set({
          content_text: v(finalDraft.question_text),
          content_text_struct: toSqlJsonExpr(finalDraft.question_text_struct),
          update_time: "NOW()",
          publish_time: "COALESCE(publish_time, NOW())",
          review_status: `'passed'::review_status`,
          review_id: `${v(reviewId)}`,
        })
        .where(`id=${v(reviewRow.question_id)}`),
    );
  } else {
    await transaction.queryCount(
      update("exam_question")
        .set({ review_status: `'rejected'::review_status`, review_id: `${v(reviewId)}` })
        .where(`id=${v(reviewRow.question_id)}`),
    );
    await transaction.queryCount(
      update("public.post")
        .set({ review_status: `'rejected'::review_status`, review_id: `${v(reviewId)}` })
        .where(`id=${v(reviewRow.question_id)}`),
    );
  }

  await transaction.commit();
  return {
    success: true,
    next: await getNextQuestionReview(),
  };
}
