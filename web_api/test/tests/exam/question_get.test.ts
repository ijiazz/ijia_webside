import { beforeEach, expect } from "vitest";
import { test, Context } from "#test/fixtures/hono.ts";
import questionRoutes from "@/routers/question/mod.ts";
import { prepareUniqueUser } from "#test/fixtures/user.ts";
import { Role } from "@/middleware/auth.ts";
import { createSampleQuestion, getQuestion, getQuestionForReview, getQuestionReviewId } from "#test/utils/question.ts";
import { commitQuestionReview } from "@/routers/review/mod.ts";

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

  await commitQuestionReview(admin.id, { is_passed: true, review_id: reviewId, remark: "通过" });

  await expect(getQuestionForReview(api, reviewId.toString(), admin.token)).responseStatus(400);
});
test("审核不通过后，Admin 不能查看审核题目详情", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const admin = await prepareUniqueUser("admin", { roles: [Role.Admin] });
  const { question_id } = await createSampleQuestion(api, alice.token, { question_text: "待审核题目" });
  const reviewId = await getQuestionReviewId(question_id);

  await commitQuestionReview(admin.id, { is_passed: false, review_id: reviewId, remark: "不通过" });

  await expect(getQuestionForReview(api, reviewId.toString(), admin.token)).responseStatus(400);
});
