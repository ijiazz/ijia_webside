import { vioServerTest as test } from "@/fixtures/test.ts";
import { setContextLogin } from "@/utils/browser.ts";
import { getUserQuestionURL } from "@/utils/question.ts";
import { initAlice, loginGetToken } from "@/utils/user.ts";
import { Page } from "@playwright/test";

const { expect } = test;

test("用户创建题目", async function ({ page, context }) {
  const alice = await initAlice();
  const aliceToken = await loginGetToken(alice.email, alice.password);
  const questionText = "e2e-create-question-text";

  await setContextLogin(context, aliceToken);
  await page.goto(getUserQuestionURL(alice.id));

  await page.getByRole("button", { name: "发布题目" }).click();
  await fillSingleChoiceQuestionForm(page, {
    questionText,
    explanationText: "e2e-create-question-explanation",
    options: ["选项A", "选项B", "选项C", "选项D"],
    answerLabel: "B",
  });
  await page.getByRole("button", { name: "创建题目" }).click();

  await expect(page).toHaveURL(getUserQuestionURL(alice.id));

  const createdCard = page.locator(".e2e-question-card", { hasText: questionText });
  await expect(createdCard, "创建后题目应出现在个人题目列表").toHaveCount(1);
  await expect(createdCard.getByText("审核中"), "新创建题目应显示审核中状态").toHaveCount(1);

  await page.reload();
  await expect(page.locator(".e2e-question-card", { hasText: questionText }), "刷新后仍能看到刚创建的题目").toHaveCount(
    1,
  );
});
async function fillSingleChoiceQuestionForm(
  page: Page,
  data: {
    questionText: string;
    explanationText: string;
    options: [string, string, string, string];
    answerLabel: "A" | "B" | "C" | "D";
  },
) {
  await page.getByRole("textbox", { name: "题目内容" }).fill(data.questionText);
  await page.getByRole("textbox", { name: "答案解析" }).fill(data.explanationText);

  for (const [index, optionText] of data.options.entries()) {
    const label = String.fromCharCode(65 + index);
    await page.getByRole("textbox", { name: `选项 ${label} 内容` }).fill(optionText);
  }

  await page.getByRole("radio", { name: `设置选项 ${data.answerLabel} 为正确答案` }).check();
}
