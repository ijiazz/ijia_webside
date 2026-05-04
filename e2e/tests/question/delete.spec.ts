import { vioServerTest as test } from "@/fixtures/test.ts";
import { MODAL_ACTION_WAIT_TIME, setContextLogin } from "@/utils/browser.ts";
import { createQuestion, getUserQuestionURL } from "@/utils/question.ts";
import { initAlice, loginGetToken } from "@/utils/user.ts";

const { expect } = test;

test("用户删除题目", async function ({ page, context }) {
  const alice = await initAlice();
  const aliceToken = await loginGetToken(alice.email, alice.password);
  const deletedText = "e2e-delete-question-target";
  const remainText = "e2e-delete-question-remain";

  await createQuestion(aliceToken, { question_text: deletedText, explanation_text: "待删除解析" });
  await createQuestion(aliceToken, { question_text: remainText, explanation_text: "保留解析" });

  await setContextLogin(context, aliceToken);
  await page.goto(getUserQuestionURL(alice.id));

  await expect(page.locator(".e2e-question-card"), "初始化时应有两道题目").toHaveCount(2);

  const targetCard = page.locator(".e2e-question-card", { hasText: deletedText });
  await targetCard.getByRole("button", { name: "题目更多操作" }).click();
  await page.getByRole("menuitem", { name: "删除" }).click();
  await page.waitForTimeout(MODAL_ACTION_WAIT_TIME);
  await page.getByRole("button", { name: /确\s*定/ }).click();

  await expect(page.locator(".e2e-question-card", { hasText: deletedText }), "删除后目标题目应从列表中消失").toHaveCount(0);
  await expect(page.locator(".e2e-question-card", { hasText: remainText }), "其他题目应继续保留在列表中").toHaveCount(1);

  await page.reload();
  await expect(page.locator(".e2e-question-card", { hasText: deletedText }), "刷新后被删除题目仍不应出现").toHaveCount(0);
  await expect(page.locator(".e2e-question-card", { hasText: remainText }), "刷新后保留题目仍应存在").toHaveCount(1);
});