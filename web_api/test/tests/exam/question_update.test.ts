import { beforeEach, expect } from "vitest";
import { test, Context } from "../../fixtures/hono.ts";
import questionRoutes from "@/routers/question/mod.ts";
import { prepareUniqueUser } from "#test/fixtures/user.ts";
import { Role } from "@/middleware/auth.ts";
import {
  createQuestion,
  createSampleQuestion,
  deleteQuestion,
  getQuestion,
  getQuestionCount,
  getQuestionReviewId,
  updateQuestion,
} from "#test/utils/question.ts";
import { commitQuestionReview } from "@/routers/review/mod.ts";
import { dbPool } from "@/db/client.ts";
import { select, v } from "@asla/yoursql";
import { CreateQuestionParam, ExamQuestionType, UpdateQuestionParam } from "@/dto.ts";
function encodeBase64(str: string) {
  return Buffer.from(str).toString("base64");
}
beforeEach<Context>(async ({ hono }) => {
  questionRoutes.apply(hono);
});

test("其他用户不能删除别人的题目", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const bob = await prepareUniqueUser("bob");
  const created = await createSampleQuestion(api, alice.token);

  await expect(deleteQuestion(api, created.question_id, bob.token)).responseStatus(400);
});
test("删除审核通过的题目后，题目将归属于系统，并更新用户总题数", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const admin = await prepareUniqueUser("admin", { roles: [Role.Admin] });
  const { question_id } = await createSampleQuestion(api, alice.token);

  const reviewId = await getQuestionReviewId(question_id);
  await commitQuestionReview(admin.id, { review_id: reviewId, is_passed: true, remark: "通过" });

  expect(await getQuestionCount(alice.id)).toBe(1);

  await deleteQuestion(api, question_id, alice.token);

  const state = await getQuestionDbState(question_id);
  expect(state.user_id, "用户应属于系统").toBeNull();

  await expect(getQuestionCount(alice.id), "题目计数减 1").resolves.toBe(0);
});
test("删除审核中的题目后，题目仍为审核中，但不再归属于用户，并更新用户总题数", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const { question_id } = await createSampleQuestion(api, alice.token);
  expect(await getQuestionCount(alice.id)).toBe(1);

  await deleteQuestion(api, question_id, alice.token);

  const state = await getQuestionDbState(question_id);
  expect(state.user_id, "用户应属于系统").toBeNull();

  await expect(getQuestionCount(alice.id), "题目计数减 1").resolves.toBe(0);
});

test("审核通过前，仅更新选项", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");

  const createParam: CreateQuestionParam = {
    question_type: ExamQuestionType.SingleChoice,
    options: [{ text: "选项1" }, { text: "选项2" }],
    attachments: [
      {
        text: "附件1",
        file: { type: "image/png", data: encodeBase64("这是附件内容") },
      },
    ],
    answer_index: [0],
    explanation_text: "解析",
    question_text: "题目",
  };
  const { question_id } = await createQuestion(api, alice.token, createParam);

  const updateParam: UpdateQuestionParam = {
    options: [{ text: "新选项1" }, { text: "新选项2" }, { text: "新选项3" }],
  };
  await updateQuestion({ api, questionId: question_id, token: alice.token, body: updateParam });

  const { item } = await getQuestion(api, question_id, alice.token);
  expect(item.attachments, "附件应没有更新").toEqual(createParam.attachments);
  expect(item.options, "选项应已更新").toEqual(updateParam.options);
});

test("审核通过前，仅更新附件", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");

  const createParam: CreateQuestionParam = {
    question_type: ExamQuestionType.SingleChoice,
    attachments: [
      {
        text: "附件1",
        file: { type: "image/png", data: encodeBase64("这是附件内容") },
      },
    ],
    options: [{ text: "选项1" }, { text: "选项2" }],
    answer_index: [0],
    explanation_text: "解析",
    question_text: "题目",
  };
  const { question_id } = await createQuestion(api, alice.token, createParam);

  const updateParam: UpdateQuestionParam = {
    attachments: [
      {
        text: "附件0",
        file: { type: "image/png", data: encodeBase64("234") },
      },
    ],
  };
  await updateQuestion({ api, questionId: question_id, token: alice.token, body: updateParam });

  const { item } = await getQuestion(api, question_id, alice.token);
  expect(item.attachments, "附件应已更新").toEqual(updateParam.attachments);
  expect(item.options, "选项应已更新").toEqual(createParam.options);
});

test("审核通过后，题目不允许再被更改", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const admin = await prepareUniqueUser("admin", { roles: [Role.Admin] });
  const { question_id } = await createSampleQuestion(api, alice.token);

  const reviewId = await getQuestionReviewId(question_id);
  await commitQuestionReview(admin.id, { review_id: reviewId, is_passed: true, remark: "通过" });

  await expect(
    updateQuestion({
      api,
      questionId: question_id,
      token: alice.token,
      body: {
        question_text: "新题目",
        explanation_text: "新解析",
      },
    }),
    "审核通过的题目不允许修改",
  ).responseStatus(400);
});
test("修改题目后，题目应仍处于处于待审核状态", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const { question_id } = await createSampleQuestion(api, alice.token, { question_text: "旧题目" });

  const updateParam: UpdateQuestionParam = {
    question_text: "新题目",
    explanation_text: "新解析",
  };

  await updateQuestion({ api, questionId: question_id, token: alice.token, body: updateParam });

  const { item } = await getQuestion(api, question_id, alice.token);
  expect(item.review?.status).toBe("pending");
  expect(item.question_text).toBe("新题目");
});

async function getQuestionDbState(questionId: string | number) {
  return dbPool.queryFirstRow<{
    user_id: number | null;
    is_system_gen: boolean;
  }>(
    select(["user_id", "is_system_gen"])
      .from("exam_question")
      .where(`id=${v(questionId)}`),
  );
}
