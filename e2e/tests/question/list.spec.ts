import { ReviewStatus } from "@/api.ts";
import { vioServerTest as test } from "@/fixtures/test.ts";
import { setContextLogin } from "@/utils/browser.ts";
import { createQuestion, getUserQuestionURL, setQuestionReviewStatus } from "@/utils/question.ts";
import { initAdmin, initAlice, initBob, loginGetToken } from "@/utils/user.ts";

const { expect } = test;

test("可以访问其他用户题目列表时，只能看到审核通过的题目列表", async function ({ page, context }) {
  const alice = await initAlice();
  const aliceToken = await loginGetToken(alice.email, alice.password);
  const bob = await initBob();
  const bobToken = await loginGetToken(bob.email, bob.password);
  const admin = await initAdmin();

  await createQuestion(aliceToken, { question_text: "e2e-other-question-pending", explanation_text: "待审核解析" });

  const { question_id: passedId } = await createQuestion(aliceToken, {
    question_text: "e2e-other-question-passed",
    explanation_text: "审核通过解析",
  });
  const { question_id: rejectedId } = await createQuestion(aliceToken, {
    question_text: "e2e-other-question-rejected",
    explanation_text: "驳回解析",
  });

  await setQuestionReviewStatus(passedId, admin.token, ReviewStatus.passed);
  await setQuestionReviewStatus(rejectedId, admin.token, ReviewStatus.rejected, "需要修改");

  await setContextLogin(context, bobToken);
  await page.goto(getUserQuestionURL(alice.id));

  await expect(page.locator(".e2e-question-card", { hasText: "e2e-other-question-passed" })).toHaveCount(1);
  await expect(page.locator(".e2e-question-card", { hasText: "e2e-other-question-pending" })).toHaveCount(0);
  await expect(page.locator(".e2e-question-card", { hasText: "e2e-other-question-rejected" })).toHaveCount(0);
  await expect(page.locator(".e2e-question-card")).toHaveCount(1);

  const card = page.locator(".e2e-question-card", { hasText: "e2e-other-question-readonly" }).first();

  await expect(card.getByRole("button", { name: "题目更多操作" }), "其他用户题目列表不应出现编辑/删除入口").toHaveCount(
    0,
  );
  await expect(page.getByRole("button", { name: "发布题目" }), "访问他人列表时发布按钮应不可用").toBeDisabled();
});
