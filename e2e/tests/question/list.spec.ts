import { ReviewStatus } from "@ijia/api-types";
import { test, expect } from "@playwright/test";
import { setContextLogin } from "@/utils/browser.ts";
import { createQuestion, getUserQuestionURL, setQuestionReviewStatus } from "@/utils/question.ts";
import { initAdmin, initAlice, initBob, loginGetToken } from "@/utils/user.ts";

test("我的题目只展示当前用户的题目", async function ({ page, context }) {
  const alice = await initAlice();
  const aliceToken = await loginGetToken(alice.email);
  const bob = await initBob();
  const bobToken = await loginGetToken(bob.email);
  const admin = await initAdmin();

  await createQuestion(aliceToken, { question_text: "e2e-self-question-pending", explanation_text: "待审核解析" });

  const { question_id: passedId } = await createQuestion(aliceToken, {
    question_text: "e2e-self-question-passed",
    explanation_text: "审核通过解析",
  });
  const { question_id: rejectedId } = await createQuestion(aliceToken, {
    question_text: "e2e-self-question-rejected",
    explanation_text: "驳回解析",
  });
  await createQuestion(bobToken, { question_text: "e2e-bob-question", explanation_text: "Bob 的解析" });

  await setQuestionReviewStatus(passedId, admin.token, ReviewStatus.passed);
  await setQuestionReviewStatus(rejectedId, admin.token, ReviewStatus.rejected, "需要修改");

  await setContextLogin(context, aliceToken);
  await page.goto(getUserQuestionURL());

  await expect(page.locator(".e2e-question-card", { hasText: "e2e-self-question-passed" })).toHaveCount(1);
  await expect(page.locator(".e2e-question-card", { hasText: "e2e-self-question-pending" })).toHaveCount(1);
  await expect(page.locator(".e2e-question-card", { hasText: "e2e-self-question-rejected" })).toHaveCount(1);
  await expect(page.locator(".e2e-question-card", { hasText: "e2e-bob-question" })).toHaveCount(0);
  await expect(page.locator(".e2e-question-card")).toHaveCount(3);
  await expect(page.getByRole("button", { name: "发布题目" })).toBeEnabled();
  await expect(page.getByRole("button", { name: "题目更多操作" })).toHaveCount(3);
});
