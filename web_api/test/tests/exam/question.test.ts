import { beforeEach, expect } from "vitest";
import { test, Context, JWT_TOKEN_KEY } from "../../fixtures/hono.ts";
import questionRoutes from "@/routers/question/mod.ts";
import { prepareUniqueUser } from "#test/fixtures/user.ts";
import { Role } from "@/middleware/auth.ts";
import {
  commitQuestionReview,
  createSampleQuestion,
  getQuestion,
  getQuestionCount,
  getQuestionReviewId,
  listUserQuestion,
} from "#test/utils/question.ts";
import { ReviewStatus } from "@/dto.ts";

beforeEach<Context>(async ({ hono }) => {
  questionRoutes.apply(hono);
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

test("审核中、和审核不通过的题目，只有自己能查看", async function ({ api, publicDbPool }) {
  const blob = await prepareUniqueUser("blob");
  const alice = await prepareUniqueUser("alice");
  const admin = await prepareUniqueUser("admin", { roles: [Role.Admin] });

  const pending = await createSampleQuestion(api, alice.token, { question_text: "待审核题" });
  const rejected = await createSampleQuestion(api, alice.token, { question_text: "会被拒绝" });

  const rejectedReviewId = await getQuestionReviewId(rejected.question_id);
  await commitQuestionReview(api, rejectedReviewId, admin.token, { is_passed: false, remark: "不通过" });
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

  await commitQuestionReview(api, reviewId!, admin.token, { is_passed: true, remark: "通过" });

  const list = await listUserQuestion(api, { token: alice.token });
  expect(list.items).toHaveLength(1);
  expect(list.items[0].question_id).toBe(created.question_id);
  expect(list.items[0].review?.status).toBe(ReviewStatus.passed);
});

test("获取别人的题目列表，应只能获取审核通过的", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const bob = await prepareUniqueUser("bob");
  const admin = await prepareUniqueUser("admin", { roles: [Role.Admin] });
  const pending = await createSampleQuestion(api, alice.token, { question_text: "待审核" });
  const passed = await createSampleQuestion(api, alice.token, { question_text: "审核通过" });
  const reviewId = await getQuestionReviewId(passed.question_id);

  await commitQuestionReview(api, reviewId, admin.token, { is_passed: true, remark: "通过" });

  const list = await listUserQuestion(api, { token: bob.token, userId: alice.id });
  expect(list.items).toHaveLength(1);
  expect(list.items[0].question_id).toBe(passed.question_id);
  expect(list.items[0].question_text).toBe("审核通过");
  expect(list.items[0].question_id).not.toBe(pending.question_id);
});

test("别人不能查看未审核通过的题目详情", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const bob = await prepareUniqueUser("bob");
  const created = await createSampleQuestion(api, alice.token, { question_text: "仅作者可见" });

  await expect(getQuestion(api, created.question_id, bob.token)).rejects.responseStatus(404);
});

test("未登录不能获取用户的题目列表", async function ({ api, publicDbPool }) {
  await expect(listUserQuestion(api)).rejects.responseStatus(401);
});

test("登录后可以查看题目统计", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const admin = await prepareUniqueUser("admin", { roles: [Role.Admin] });
  await createSampleQuestion(api, alice.token, { question_text: "待审核" });
  const passed = await createSampleQuestion(api, alice.token, { question_text: "审核通过" });
  const reviewId = await getQuestionReviewId(passed.question_id);
  await commitQuestionReview(api, reviewId!, admin.token, { is_passed: true, remark: "通过" });

  await expect(api["/question/public_stats"].get()).rejects.responseStatus(401);

  const res = await api["/question/public_stats"].get({ [JWT_TOKEN_KEY]: alice.token });
  expect(res).toEqual({
    reviewing_count: 1,
    total_count: 2,
  });
});
