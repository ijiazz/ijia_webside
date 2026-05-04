import { beforeEach, expect } from "vitest";
import { test, Context } from "#test/fixtures/hono.ts";
import questionRoutes from "@/routers/question/mod.ts";
import { prepareUniqueUser } from "#test/fixtures/user.ts";
import { Role } from "@/middleware/auth.ts";
import { createSampleQuestion, getQuestion, getQuestionForReview, getQuestionReviewId } from "#test/utils/question.ts";
import { commitQuestionReview } from "@/routers/review/mod.ts";
import { CreateQuestionParam, ExamQuestionType, TextStructureType } from "@/dto.ts";

beforeEach<Context>(async ({ hono }) => {
  questionRoutes.apply(hono);
});

test("未登录不能查看题目详情", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const { question_id } = await createSampleQuestion(api, alice.token);

  await expect(getQuestion(api, question_id)).responseStatus(401);
});

test("创建者可以查看自己的题目详情，其他用户不能查看", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const bob = await prepareUniqueUser("bob");
  const { question_id } = await createSampleQuestion(api, alice.token, { question_text: "只允许作者查看" });

  const result = await getQuestion(api, question_id, alice.token);
  expect(result.item.question_id).toBe(question_id);
  expect(result.item.question_text).toBe("只允许作者查看");

  await expect(getQuestion(api, question_id, bob.token)).responseStatus(400);
});

test("未登录或非 Admin 不能查看审核题目详情", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const bob = await prepareUniqueUser("bob");
  const { question_id } = await createSampleQuestion(api, alice.token);
  const reviewId = await getQuestionReviewId(question_id);

  await expect(getQuestionForReview(api, reviewId.toString())).responseStatus(401);
  await expect(getQuestionForReview(api, reviewId.toString(), bob.token)).responseStatus(403);
});

test("Admin 可以查看审核中的题目详情", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const admin = await prepareUniqueUser("admin", { roles: [Role.Admin] });
  const { question_id } = await createSampleQuestion(api, alice.token, { question_text: "待审核题目" });
  const reviewId = await getQuestionReviewId(question_id);

  const result = await getQuestionForReview(api, reviewId.toString(), admin.token);

  expect(result.item.question_id).toBe(question_id);
  expect(result.item.question_text).toBe("待审核题目");
});
test("审核通过后，Admin 不能查看审核题目详情", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const admin = await prepareUniqueUser("admin", { roles: [Role.Admin] });
  const { question_id } = await createSampleQuestion(api, alice.token, { question_text: "待审核题目" });
  const reviewId = await getQuestionReviewId(question_id);

  await commitQuestionReview(admin.id, { is_passed: true, review_id: +reviewId, remark: "通过" });

  await expect(getQuestionForReview(api, reviewId.toString(), admin.token)).responseStatus(400);
});
test("审核不通过后，Admin 不能查看审核题目详情", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const admin = await prepareUniqueUser("admin", { roles: [Role.Admin] });
  const { question_id } = await createSampleQuestion(api, alice.token, { question_text: "待审核题目" });
  const reviewId = await getQuestionReviewId(question_id);

  await commitQuestionReview(admin.id, { is_passed: false, review_id: +reviewId, remark: "不通过" });

  await expect(getQuestionForReview(api, reviewId.toString(), admin.token)).responseStatus(400);
});

test("断言所有字段存在", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");

  const input: CreateQuestionParam = {
    question_text: "字段完整性测试",
    options: [{ text: "选项1" }, { text: "选项2" }],
    answer_index: [0],
    explanation_text: "选项1是正确答案",
    explanation_text_struct: [{ type: TextStructureType.user, index: 0, length: 1, user_id: alice.id.toString() }],
    event_time: "2024-01-01T00:00:00.000Z",
    question_type: ExamQuestionType.SingleChoice,
    question_text_struct: [{ type: TextStructureType.user, index: 0, length: 1, user_id: alice.id.toString() }],
  };
  const { question_id } = await createSampleQuestion(api, alice.token, input);

  const result = await getQuestion(api, question_id, alice.token);
  expect(result.item).toMatchObject({
    question_text: input.question_text,
    options: input.options,
    event_time: input.event_time,
    question_type: input.question_type,
    question_text_struct: input.question_text_struct ?? undefined,
    user: {
      user_id: alice.id.toString(),
      nickname: alice.nickname,
    },
    answer: {
      answer_index: input.answer_index,
      explanation_text: input.explanation_text,
      explanation_text_struct: input.explanation_text_struct ?? undefined,
    },
  } satisfies Partial<typeof result.item>);

  expect(result.item).toMatchObject({
    collection_level: 0,
    difficulty_level: 0,
  } satisfies Partial<typeof result.item>);
});
