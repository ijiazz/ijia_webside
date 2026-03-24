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
  getQuestionReviewId,
  getQuestionReviewNext,
  updateQuestion,
} from "#test/utils/question.ts";
import { ReviewStatus } from "@/dto.ts";
import { reviewRoutes } from "@/routers/mod.ts";
import "#test/asserts/review.ts";
import { getQuestionReviewStatus, QuestionReviewInfo } from "#test/utils/review.ts";

beforeEach<Context>(async ({ hono }) => {
  questionRoutes.apply(hono);
  reviewRoutes.apply(hono);
});

test("非 Admin 角色不能获取审核题目和提交审核", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const bob = await prepareUniqueUser("bob");
  const { question_id } = await createSampleQuestion(api, alice.token);
  const reviewId = await getQuestionReviewId(question_id);

  await expect(getQuestionReviewNext(api)).responseStatus(401);
  await expect(getQuestionReviewNext(api, bob.token)).responseStatus(403);
  await expect(commitQuestionReview(api, undefined, { is_passed: true, review_id: reviewId })).responseStatus(401);
  await expect(commitQuestionReview(api, bob.token, { is_passed: true, review_id: reviewId })).responseStatus(403);
});

test("审核通过", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const admin = await prepareUniqueUser("admin", { roles: [Role.Admin] });
  const created = await createSampleQuestion(api, alice.token, { question_text: "会通过" });
  const reviewId = await getQuestionReviewId(created.question_id);

  const result = await commitQuestionReview(api, admin.token, { is_passed: true, remark: "通过", review_id: reviewId });
  expect(result.success).toBe(true);

  await expect(created.question_id).questionReviewStatusIs(ReviewStatus.passed);
});

test("审核不通过，并给出评论", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const admin = await prepareUniqueUser("admin", { roles: [Role.Admin] });
  const created = await createSampleQuestion(api, alice.token, { question_text: "会被拒绝" });
  const reviewId = await getQuestionReviewId(created.question_id);

  await commitQuestionReview(api, admin.token, { is_passed: false, remark: "答案不完整", review_id: reviewId });

  const reviewStatus = await getQuestionReviewStatus(+created.question_id);
  expect(reviewStatus).toMatchObject({
    status: ReviewStatus.rejected,
    remark: "答案不完整",
  } satisfies Partial<QuestionReviewInfo>);
});

test("审核通过，并更新题目信息", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const admin = await prepareUniqueUser("admin", { roles: [Role.Admin] });
  const created = await createSampleQuestion(api, alice.token, { question_text: "旧题目", explanation_text: "旧解析" });
  const reviewId = await getQuestionReviewId(created.question_id);

  await commitQuestionReview(api, admin.token, {
    is_passed: true,
    remark: "通过并修正",
    review_id: reviewId,
    update: {
      question_text: "新题目",
      answer_index: [1],
      options: [{ text: "A" }, { text: "B" }],
      explanation_text: "新解析",
    },
  });
  await expect(created.question_id).questionReviewStatusIs(ReviewStatus.passed);
  const { item } = await getQuestion(api, created.question_id, alice.token);
  expect(item.question_text).toBe("新题目");
});

test("同一个审核项不能重复提交审核", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const admin = await prepareUniqueUser("admin", { roles: [Role.Admin] });
  const created = await createSampleQuestion(api, alice.token, { question_text: "只审一次" });
  const reviewId = await getQuestionReviewId(created.question_id);

  const res1 = await commitQuestionReview(api, admin.token, { is_passed: true, remark: "通过", review_id: reviewId });
  expect(res1.success).toBe(true);

  await expect(
    commitQuestionReview(api, admin.token, { is_passed: false, remark: "再次提交", review_id: reviewId }),
  ).responseStatus(400);

  await expect(created.question_id).questionReviewStatusIs(ReviewStatus.passed);
});

test("审核修正题目时，非法答案索引应返回 400", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const admin = await prepareUniqueUser("admin", { roles: [Role.Admin] });
  const created = await createSampleQuestion(api, alice.token, { question_text: "待修正" });
  const reviewId = await getQuestionReviewId(created.question_id);

  await expect(
    commitQuestionReview(api, admin.token, {
      is_passed: true,
      review_id: reviewId,
      update: {
        options: [{ text: "A" }, { text: "B" }],
        answer_index: [5],
      },
    }),
  ).responseStatus(400);
});
test("审核中的题目被用户删除后，仍需要审核", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const admin = await prepareUniqueUser("admin", { roles: [Role.Admin] });
  const { question_id } = await createSampleQuestion(api, alice.token, { question_text: "旧题目" });
  const reviewId = await getQuestionReviewId(question_id);

  await deleteQuestion(api, question_id, alice.token);

  const res1 = await commitQuestionReview(api, admin.token, { is_passed: true, remark: "通过", review_id: reviewId });
  expect(res1.success).toBe(true);

  await expect(question_id).questionReviewStatusIs(ReviewStatus.passed);
});

test("修改题目后，应能提交审核", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const admin = await prepareUniqueUser("admin", { roles: [Role.Admin] });
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

  const reviewId = await getQuestionReviewId(question_id);
  await commitQuestionReview(api, admin.token, { is_passed: true, remark: "通过", review_id: reviewId });

  const { item } = await getQuestion(api, question_id, alice.token);
  expect(item.question_text).toBe("新题目");
});
