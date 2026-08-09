import { beforeEach, expect } from "vitest";
import { test, Context, JWT_TOKEN_KEY } from "../../fixtures/hono.ts";
import questionRoutes from "@/routers/question/mod.ts";
import { prepareUniqueUser } from "#test/utils/user.ts";
import { Role } from "@/common/userInfo.ts";
import { createSampleQuestion, getQuestion, getQuestionReviewId, listUserQuestion } from "#test/utils/question.ts";
import { ReviewStatus } from "@/dto.ts";
import { commitQuestionReview } from "@/routers/review/mod.ts";

beforeEach<Context>(async ({ hono }) => {
  questionRoutes.apply(hono);
});
test("用户只能查看自己的题目列表", async function ({ api, publicDbPool }) {
  const bob = await prepareUniqueUser("bob");
  const alice = await prepareUniqueUser("alice");
  const admin = await prepareUniqueUser("admin", { roles: [Role.Admin] });

  const pending = await createSampleQuestion(api, alice.token, { question_text: "待审核题" });
  const passed = await createSampleQuestion(api, alice.token, { question_text: "审核通过题" });
  const rejected = await createSampleQuestion(api, alice.token, { question_text: "会被拒绝" });
  const bobQuestion = await createSampleQuestion(api, bob.token, { question_text: "Bob 的题目" });

  const passedReviewId = await getQuestionReviewId(passed.question_id);
  const rejectedReviewId = await getQuestionReviewId(rejected.question_id);
  await commitQuestionReview(admin.id, { review_id: Number(passedReviewId), is_passed: true, remark: "通过" });
  await commitQuestionReview(admin.id, { review_id: Number(rejectedReviewId), is_passed: false, remark: "不通过" });
  {
    const list = await listUserQuestion(api, { token: alice.token });
    expect(list.items, "Alice 能查看自己所有审核状态的题目").toHaveLength(3);
    expect(list.items.map((item) => item.question_id)).toEqual(
      expect.arrayContaining([pending.question_id, passed.question_id, rejected.question_id]),
    );
    expect(list.items.map((item) => item.question_id)).not.toContain(bobQuestion.question_id);
  }
  {
    const list = await listUserQuestion(api, { token: bob.token });
    expect(list.items, "Bob 只能查看自己的题目").toHaveLength(1);
    expect(list.items[0].question_id).toBe(bobQuestion.question_id);
  }
});

test("可以或获取自己的审核通过的题目列表", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const admin = await prepareUniqueUser("admin", { roles: [Role.Admin] });
  const created = await createSampleQuestion(api, alice.token, { question_text: "会通过" });
  const reviewId = await getQuestionReviewId(created.question_id);

  await commitQuestionReview(admin.id, { review_id: Number(reviewId), is_passed: true, remark: "通过" });

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
  await commitQuestionReview(admin.id, { review_id: Number(reviewId), is_passed: true, remark: "通过" });

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
  await commitQuestionReview(admin.id, { review_id: Number(reviewId), is_passed: true, remark: "通过" });

  await expect(api["/question/public_stats"].get()).responseStatus(401);

  const res = await api["/question/public_stats"].get({ [JWT_TOKEN_KEY]: alice.token });
  expect(res).toBeTypeOf("object");
});
