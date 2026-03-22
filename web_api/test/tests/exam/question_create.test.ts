import { beforeEach, expect } from "vitest";
import { test, Context } from "#test/fixtures/hono.ts";
import questionRoutes from "@/routers/question/mod.ts";
import { prepareUniqueUser } from "#test/fixtures/user.ts";
import { createQuestion, createSampleQuestion, getQuestion, getQuestionCount } from "#test/utils/question.ts";
import { CreateQuestionParam, ExamQuestionType, QuestionPublic, ReviewStatus, TextStructureType } from "@/dto.ts";
import { Role } from "@/middleware/auth.ts";
import { v } from "@/sql/utils.ts";
import "#test/asserts/review.ts";

function encodeBase64(str: string) {
  return Buffer.from(str).toString("base64");
}
beforeEach<Context>(async ({ hono }) => {
  questionRoutes.apply(hono);
});
test("创建一个题目，并设置所有参数", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");

  const file = { type: "image/png", data: encodeBase64("aaab") };
  const attachment = { type: "image/png", data: encodeBase64("bbbb") };

  const option: CreateQuestionParam = {
    question_text: "新题目",
    explanation_text: "新解析",
    answer_index: [0, 1],
    options: [
      { text: "选项1", file },
      { text: "选项2", file },
      { text: "选项3", file },
    ],
    question_text_struct: [{ index: 0, length: 1, type: TextStructureType.user, user_id: "1" }],
    explanation_text_struct: [{ index: 0, length: 1, type: TextStructureType.user, user_id: "1" }],
    question_type: ExamQuestionType.MultipleChoice,
    attachments: [
      { file: attachment, text: "附件1" },
      { file: attachment, text: "附件2" },
    ],
    event_time: new Date("2024-01-01T00:00:00Z").toISOString(),
  } as const;

  const { question_id } = await createQuestion(api, alice.token, option);

  const { item } = await getQuestion(api, question_id, alice.token);

  expect(item).toMatchObject({
    attachments: option.attachments,
    options: option.options,
    question_text_struct: option.question_text_struct ?? undefined,
    question_type: option.question_type,
    question_text: option.question_text,
  } satisfies Partial<QuestionPublic>);
  //TODO: 断言答案
  // TODO: 查询
});

test("创建题目，并添加题目附件和选项附件", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");

  const file = { type: "image/png", data: encodeBase64("aaab") };
  const attachment = { type: "image/png", data: encodeBase64("bbbb") };

  const option: CreateQuestionParam = {
    question_text: "新题目",
    explanation_text: "新解析",
    answer_index: [0, 1],
    options: [
      { text: "选项1", file },
      { text: "选项2", file },
      { text: "选项3", file },
    ],
    attachments: [
      { file: attachment, text: "附件1" },
      { file: attachment, text: "附件2" },
    ],
    question_type: ExamQuestionType.MultipleChoice,
  } as const;

  const { question_id } = await createQuestion(api, alice.token, option);

  const { item } = await getQuestion(api, question_id, alice.token);

  expect(item).toMatchObject({
    attachments: option.attachments,
    options: option.options,
  } satisfies Partial<QuestionPublic>);
});

test("普通用户出题后，题目应该处于待审核状态", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const { question_id } = await createSampleQuestion(api, alice.token);

  const { item } = await getQuestion(api, question_id, alice.token);
  expect(item.review?.status).toBe(ReviewStatus.pending);
});

test("创建题目后，应更新用户总题数", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  await expect(getQuestionCount(alice.id)).resolves.toBe(0);

  await createSampleQuestion(api, alice.token);

  await expect(getQuestionCount(alice.id)).resolves.toBe(1);
});

test("Admin 角色创建题目后，题目应直接通过审核", async function ({ api, publicDbPool }) {
  const admin = await prepareUniqueUser("admin", { roles: [Role.Admin] });
  const { question_id } = await createSampleQuestion(api, admin.token);

  await expect(question_id).questionReviewStatusIs(ReviewStatus.passed);
});

test("非 Admin 角色不能设置题目的高级配置", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const createParam: CreateQuestionParam = {
    question_text: "新题目",
    explanation_text: "新解析",
    answer_index: [0],
    options: [{ text: "选项1" }],
    question_type: ExamQuestionType.SingleChoice,
  };
  await expect(
    createQuestion(api, alice.token, {
      ...createParam,
      advanced_config: { long_time: true, difficulty_level: 3, collection_level: 2 },
    }),
  ).responseStatus(400);

  await expect(
    createQuestion(api, alice.token, {
      ...createParam,
      advanced_config: {},
    }),
  ).responseStatus(400);
});

test("Admin 角色创建题目时，可以设置题目的高级配置", async function ({ api, publicDbPool }) {
  const admin = await prepareUniqueUser("admin", { roles: [Role.Admin] });
  const createParam: CreateQuestionParam = {
    question_text: "新题目",
    explanation_text: "新解析",
    answer_index: [0],
    options: [{ text: "选项1" }, { text: "选项2" }],
    question_type: ExamQuestionType.SingleChoice,
    advanced_config: { long_time: true, difficulty_level: 3, collection_level: 2 },
  };
  const { question_id } = await createQuestion(api, admin.token, createParam);

  const sql = v.gen`SELECT long_time, difficulty_level, collection_level FROM exam_question WHERE id=${question_id}`;
  const row = await publicDbPool.queryFirstRow(sql);
  expect(row.long_time).toBe(true);
  expect(row.difficulty_level).toBe(3);
  expect(row.collection_level).toBe(2);
});
