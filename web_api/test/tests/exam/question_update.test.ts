import { beforeEach, expect } from "vitest";
import { test, Context } from "../../fixtures/hono.ts";
import questionRoutes from "@/routers/question/mod.ts";
import { prepareUniqueUser } from "#test/fixtures/user.ts";
import { Role } from "@/middleware/auth.ts";
import {
  commitQuestionReview,
  createSampleQuestion,
  deleteQuestion,
  getQuestion,
  getQuestionCount,
  getQuestionDbState,
  getQuestionReviewId,
  listUserQuestion,
  updateQuestion,
} from "#test/utils/question.ts";

beforeEach<Context>(async ({ hono }) => {
  questionRoutes.apply(hono);
});

test("其他用户不能删除别人的题目", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const bob = await prepareUniqueUser("bob");
  const created = await createSampleQuestion(api, alice.token);

  await expect(deleteQuestion(api, created.question_id, bob.token)).rejects.responseStatus(404);
});
test("删除审核通过的题目后，题目将归属于系统，并更新用户总题数", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const admin = await prepareUniqueUser("admin", { roles: [Role.Admin] });
  const { question_id } = await createSampleQuestion(api, alice.token);

  const reviewId = await getQuestionReviewId(question_id);
  await commitQuestionReview(api, reviewId, admin.token, { is_passed: true, remark: "通过" });

  expect(await getQuestionCount(alice.id)).toBe(1);

  await deleteQuestion(api, question_id, alice.token);

  const state = await getQuestionDbState(question_id);
  expect(state.user_id).toBeNull();
  await expect(getQuestionCount(alice.id)).resolves.toBe(0);

  const question = await getQuestion(api, question_id, alice.token);
  await expect(listUserQuestion(api, { token: alice.token }), "归属系统的不应在用户题目下").resolves.toHaveLength(0);
  await expect(question.item).toMatchObject({ user: null } satisfies Partial<typeof question.item>); // 题目内容被清空了
});
test("删除审核中的题目后，题目仍为审核中，但不再归属于用户，并更新用户总题数", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const { question_id } = await createSampleQuestion(api, alice.token);
  expect(await getQuestionCount(alice.id)).toBe(1);

  await deleteQuestion(api, question_id, alice.token);

  const state = await getQuestionDbState(question_id);
  expect(state.user_id).toBeNull();
  await expect(getQuestionCount(alice.id)).resolves.toBe(0);
  await expect(getQuestion(api, question_id, alice.token)).responseStatus(404);
});
test("修改题目后，题目应该处于待审核状态，且修改的信息不应提交", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const { question_id } = await createSampleQuestion(api, alice.token, { question_text: "旧题目" });

  await updateQuestion({
    api,
    questionId: question_id,
    token: alice.token,
    body: {
      question_text: "新题目",
      explanation_text: "新解析",
    },
  });

  const { item } = await getQuestion(api, question_id, alice.token);
  expect(item.review?.status).toBe("pending");
  expect(item.question_text).toBe("旧题目");
  expect(item.answer_text).toBe("1 加 1 等于 2");
});
