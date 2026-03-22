import { beforeEach, expect } from "vitest";
import { test, Context, JWT_TOKEN_KEY } from "../../fixtures/hono.ts";
import questionRoutes from "@/routers/question/mod.ts";
import { prepareUniqueUser } from "#test/fixtures/user.ts";
import { Role } from "@/middleware/auth.ts";
import { createSampleQuestion, getQuestion, getQuestionReviewId, listUserQuestion } from "#test/utils/question.ts";
import { ReviewStatus } from "@/dto.ts";
import { commitQuestionReview } from "@/routers/review/mod.ts";

beforeEach<Context>(async ({ hono }) => {
  questionRoutes.apply(hono);
});
test("审核中、和审核不通过的题目，只有自己能查看", async function ({ api, publicDbPool }) {
  const blob = await prepareUniqueUser("blob");
  const alice = await prepareUniqueUser("alice");
  const admin = await prepareUniqueUser("admin", { roles: [Role.Admin] });

  const pending = await createSampleQuestion(api, alice.token, { question_text: "待审核题" });
  const rejected = await createSampleQuestion(api, alice.token, { question_text: "会被拒绝" });

  const rejectedReviewId = await getQuestionReviewId(rejected.question_id);
  await commitQuestionReview(admin.id, { review_id: rejectedReviewId, is_passed: false, remark: "不通过" });
  {
    const list = await listUserQuestion(api, { token: alice.token });
    expect(list.items, "alice 能查看自己审核中、和审核不通过的题目").toHaveLength(2);
  }
  {
    const list = await listUserQuestion(api, { token: blob.token });
    expect(list.items, "blob 不能能查看alice审核中、和审核不通过的题目").toHaveLength(0);
  }
});

test("可以或获取自己的审核通过的题目列表", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const admin = await prepareUniqueUser("admin", { roles: [Role.Admin] });
  const created = await createSampleQuestion(api, alice.token, { question_text: "会通过" });
  const reviewId = await getQuestionReviewId(created.question_id);

  await commitQuestionReview(admin.id, { review_id: reviewId, is_passed: true, remark: "通过" });

  const { items } = await listUserQuestion(api, { token: alice.token });
  expect(items).toHaveLength(1);
  expect(items[0].question_id).toBe(created.question_id);
  expect(items[0].review?.status).toBe(ReviewStatus.passed);
});

test("不能查看别人未审核通过的题目详情", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const bob = await prepareUniqueUser("bob");
  const created = await createSampleQuestion(api, alice.token, { question_text: "abc" });

  await expect(getQuestion(api, created.question_id, bob.token)).responseStatus(400);
});
test("不能查看别人审核通过的题目详情", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const admin = await prepareUniqueUser("admin");
  const bob = await prepareUniqueUser("bob");
  const created = await createSampleQuestion(api, alice.token, { question_text: "aaa" });
  const reviewId = await getQuestionReviewId(created.question_id);
  await commitQuestionReview(admin.id, { review_id: reviewId, is_passed: true, remark: "通过" });

  await expect(getQuestion(api, created.question_id, bob.token)).responseStatus(400);
});

test("未登录不能获取用户的题目列表", async function ({ api, publicDbPool }) {
  await expect(listUserQuestion(api)).responseStatus(401);
});

test("登录后可以查看题目统计", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const admin = await prepareUniqueUser("admin", { roles: [Role.Admin] });
  await createSampleQuestion(api, alice.token, { question_text: "待审核" });
  const passed = await createSampleQuestion(api, alice.token, { question_text: "审核通过" });
  const reviewId = await getQuestionReviewId(passed.question_id);
  await commitQuestionReview(admin.id, { review_id: reviewId, is_passed: true, remark: "通过" });

  await expect(api["/question/public_stats"].get()).responseStatus(401);

  const res = await api["/question/public_stats"].get({ [JWT_TOKEN_KEY]: alice.token });
  expect(res).toBeTypeOf("object");
});
