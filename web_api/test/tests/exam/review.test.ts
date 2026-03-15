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
  getQuestionDbState,
  getQuestionReviewId,
  getQuestionReviewNext,
} from "#test/utils/question.ts";
import { ReviewStatus } from "@/dto.ts";

beforeEach<Context>(async ({ hono }) => {
  questionRoutes.apply(hono);
});

test("只有 Admin 角色可以获取审核题目和提交审核", async function ({ api, ijiaDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const bob = await prepareUniqueUser("bob");
  const admin = await prepareUniqueUser("admin", { roles: [Role.Admin] });
  const { question_id } = await createSampleQuestion(api, alice.token);
  const reviewId = await getQuestionReviewId(question_id);

  await expect(getQuestionReviewNext(api)).rejects.responseStatus(401);
  await expect(getQuestionReviewNext(api, bob.token)).rejects.responseStatus(403);
  await expect(commitQuestionReview(api, reviewId, undefined, { is_passed: true })).rejects.responseStatus(401);
  await expect(commitQuestionReview(api, reviewId, bob.token, { is_passed: true })).rejects.responseStatus(403);

  const next = await getQuestionReviewNext(api, admin.token);
  expect(next.item?.question_text).toBe("1 + 1 = ?");

  const res = await commitQuestionReview(api, reviewId!, admin.token, { is_passed: true, remark: "通过" });
  expect(res.success).toBe(true);
  expect((await getQuestionDbState(question_id)).review_status).toBe(ReviewStatus.passed);
});

test("获取审核题目项", async function ({ api, ijiaDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const admin = await prepareUniqueUser("admin", { roles: [Role.Admin] });
  await createSampleQuestion(api, alice.token, { question_text: "审核项内容" });

  const next = await getQuestionReviewNext(api, admin.token);
  expect(next.can_update_question).toBe(true);
  expect(next.item).toMatchObject({
    question_text: "审核项内容",
    question_type: "single_choice",
  });
  expect(next.pass_count).toBe(0);
  expect(next.reject_count).toBe(0);
});

test("审核通过", async function ({ api, ijiaDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const admin = await prepareUniqueUser("admin", { roles: [Role.Admin] });
  const created = await createSampleQuestion(api, alice.token, { question_text: "会通过" });
  const reviewId = await getQuestionReviewId(created.question_id);

  const result = await commitQuestionReview(api, reviewId!, admin.token, { is_passed: true, remark: "通过" });
  expect(result.success).toBe(true);

  const { item } = await getQuestion(api, created.question_id, alice.token);
  expect(item.review?.status).toBe(ReviewStatus.passed);
});

test("审核不通过，并给出评论", async function ({ api, ijiaDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const admin = await prepareUniqueUser("admin", { roles: [Role.Admin] });
  const created = await createSampleQuestion(api, alice.token, { question_text: "会被拒绝" });
  const reviewId = await getQuestionReviewId(created.question_id);

  await commitQuestionReview(api, reviewId, admin.token, { is_passed: false, remark: "答案不完整" });

  const { item } = await getQuestion(api, created.question_id, alice.token);
  expect(item.review).toMatchObject({
    status: ReviewStatus.rejected,
    reject_reason: "答案不完整",
  });
});

test("审核通过，并更新题目信息", async function ({ api, ijiaDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const admin = await prepareUniqueUser("admin", { roles: [Role.Admin] });
  const created = await createSampleQuestion(api, alice.token, { question_text: "旧题目", explanation_text: "旧解析" });
  const reviewId = await getQuestionReviewId(created.question_id);

  await commitQuestionReview(api, reviewId, admin.token, {
    is_passed: true,
    remark: "通过并修正",
    update: {
      question_id: created.question_id,
      question_text: "新题目",
      options: [{ text: "A" }, { text: "B", is_answer: true }],
      explanation_text: "新解析",
    },
  });

  const { item } = await getQuestion(api, created.question_id, alice.token);
  expect(item.question_text).toBe("新题目");
  expect(item.answer_text).toBe("新解析");
  expect(item.review?.status).toBe("passed");
});

test("同一个审核项不能重复提交审核", async function ({ api, ijiaDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const admin = await prepareUniqueUser("admin", { roles: [Role.Admin] });
  const created = await createSampleQuestion(api, alice.token, { question_text: "只审一次" });
  const reviewId = await getQuestionReviewId(created.question_id);

  const res1 = await commitQuestionReview(api, reviewId, admin.token, { is_passed: true, remark: "通过" });
  expect(res1.success).toBe(true);

  await expect(
    commitQuestionReview(api, reviewId, admin.token, { is_passed: false, remark: "再次提交" }),
  ).rejects.responseStatus(400);
});

test("审核修正题目时，非法答案索引应返回 400", async function ({ api, ijiaDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const admin = await prepareUniqueUser("admin", { roles: [Role.Admin] });
  const created = await createSampleQuestion(api, alice.token, { question_text: "待修正" });
  const reviewId = await getQuestionReviewId(created.question_id);

  await expect(
    commitQuestionReview(api, reviewId!, admin.token, {
      is_passed: true,
      update: {
        question_id: created.question_id,
        options: ["A", "B"],
        answer_index: [5],
      },
    }),
  ).rejects.responseStatus(400);
});
test("审核中的题目被用户删除后，仍需要审核", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const { question_id } = await createSampleQuestion(api, alice.token, { question_text: "旧题目" });
  const reviewId = await getQuestionReviewId(question_id);

  await deleteQuestion(api, question_id, alice.token);

  const res1 = await commitQuestionReview(api, reviewId!, alice.token, { is_passed: true, remark: "通过" });
  expect(res1.success).toBe(true);

  const res2 = await commitQuestionReview(api, reviewId!, alice.token, { is_passed: false, remark: "不通过" });
  expect(res2.success).toBe(true);

  const { item } = await getQuestion(api, question_id, alice.token);
  expect(item.review?.status).toBe("rejected");
});
