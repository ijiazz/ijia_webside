import { vioServerTest as test } from "@/fixtures/test.ts";
import { setContextLogin } from "@/utils/browser.ts";
import { ReviewStatus } from "@/api.ts";
import { createQuestion, getUserQuestionURL, setQuestionReviewStatus } from "@/utils/question.ts";
import { Page } from "@playwright/test";
import { initAdmin, initAlice, loginGetToken } from "@/utils/user.ts";

const { expect } = test;

test("编辑审核通过的题目时，只能修改部分字段", async function ({ page, context }) {
  const alice = await initAlice();
  const aliceToken = await loginGetToken(alice.email, alice.password);
  const admin = await initAdmin();
  const originalText = "e2e-edit-passed-before";
  const updatedText = "e2e-edit-passed-after";

  const { question_id } = await createQuestion(aliceToken, {
    question_text: originalText,
    explanation_text: "审核通过前解析",
  });
  await setQuestionReviewStatus(question_id, admin.token, ReviewStatus.passed);
  await setContextLogin(context, aliceToken);
  await page.goto(getUserQuestionURL(alice.id));

  await openQuestionEditor(page, originalText);

  const questionTextBox = page.getByRole("textbox", { name: "题目内容" });
  const explanationTextBox = page.getByRole("textbox", { name: "答案解析" });
  const questionTypeGroup = page.getByLabel("题型");

  await expect(questionTextBox).toHaveValue(originalText);
  await expect(questionTypeGroup, "审核通过题目的题型应为只读").toHaveAttribute("aria-readonly", "true");

  await questionTextBox.fill(updatedText);
  await explanationTextBox.fill("审核通过后更新解析");
  await page.getByRole("button", { name: "保存题目" }).click();

  await expect(page).toHaveURL(getUserQuestionURL(alice.id));
  await expect(page.locator(".e2e-question-card", { hasText: updatedText }), "审核通过题目应允许更新题目和解析").toHaveCount(1);

  await openQuestionEditor(page, updatedText);
  await expect(page.getByRole("textbox", { name: "答案解析" })).toHaveValue("审核通过后更新解析");
});

test("编辑审核中的题目时，可以修改全部编辑字段", async function ({ page, context }) {
  const alice = await initAlice();
  const aliceToken = await loginGetToken(alice.email, alice.password);
  const originalText = "e2e-edit-pending-before";
  const updatedText = "e2e-edit-pending-after";

  await createQuestion(aliceToken, {
    question_text: originalText,
    explanation_text: "待审核解析",
  });
  await setContextLogin(context, aliceToken);
  await page.goto(getUserQuestionURL(alice.id));

  await openQuestionEditor(page, originalText);

  await expect(page.getByRole("textbox", { name: "选项 A 内容" }), "审核中题目的选项内容应可编辑").toBeEnabled();
  await expect(page.getByRole("radio", { name: "设置选项 A 为正确答案" }), "审核中题目的答案应可编辑").toBeEnabled();
  await expect(page.getByLabel("题型"), "编辑题目时题型不应可修改").toHaveAttribute("aria-readonly", "true");

  await page.getByRole("textbox", { name: "题目内容" }).fill(updatedText);
  await page.getByRole("textbox", { name: "答案解析" }).fill("审核中更新解析");
  await page.getByRole("textbox", { name: "选项 A 内容" }).fill("审核中新选项A");
  await page.getByRole("radio", { name: "设置选项 A 为正确答案" }).check();
  await page.getByRole("button", { name: "保存题目" }).click();

  await expect(page).toHaveURL(getUserQuestionURL(alice.id));
  await openQuestionEditor(page, updatedText);
  await expect(page.getByRole("textbox", { name: "选项 A 内容" })).toHaveValue("审核中新选项A");
  await expect(page.getByRole("radio", { name: "设置选项 A 为正确答案" })).toBeChecked();
  await expect(page.getByRole("textbox", { name: "答案解析" })).toHaveValue("审核中更新解析");
});

test("编辑审核不通过的题目时，可以修改全部编辑字段", async function ({ page, context }) {
  const alice = await initAlice();
  const aliceToken = await loginGetToken(alice.email, alice.password);
  const admin = await initAdmin();
  const originalText = "e2e-edit-rejected-before";
  const updatedText = "e2e-edit-rejected-after";

  const { question_id } = await createQuestion(aliceToken, {
    question_text: originalText,
    explanation_text: "驳回前解析",
  });
  await setQuestionReviewStatus(question_id, admin.token, ReviewStatus.rejected, "题目需要修改");
  await setContextLogin(context, aliceToken);
  await page.goto(getUserQuestionURL(alice.id));

  await openQuestionEditor(page, originalText);

  const optionATextBox = page.getByRole("textbox", { name: "选项 A 内容" });
  const answerRadio = page.getByRole("radio", { name: "设置选项 A 为正确答案" });

  await expect(optionATextBox, "审核不通过题目的选项内容应可编辑").toBeEnabled();
  await expect(answerRadio, "审核不通过题目的答案应可编辑").toBeEnabled();
  await expect(page.getByLabel("题型"), "编辑题目时题型不应可修改").toHaveAttribute("aria-readonly", "true");

  await page.getByRole("textbox", { name: "题目内容" }).fill(updatedText);
  await page.getByRole("textbox", { name: "答案解析" }).fill("驳回后更新解析");
  await optionATextBox.fill("驳回后新选项A");
  await answerRadio.check();
  await page.getByRole("button", { name: "保存题目" }).click();

  await expect(page).toHaveURL(getUserQuestionURL(alice.id));
  await openQuestionEditor(page, updatedText);
  await expect(page.getByRole("textbox", { name: "选项 A 内容" })).toHaveValue("驳回后新选项A");
  await expect(page.getByRole("radio", { name: "设置选项 A 为正确答案" })).toBeChecked();
  await expect(page.getByRole("textbox", { name: "答案解析" })).toHaveValue("驳回后更新解析");
});
async function openQuestionEditor(page: Page, questionText: string) {
  const targetCard = page.locator(".e2e-question-card", { hasText: questionText });
  await targetCard.getByRole("button", { name: "题目更多操作" }).click();
  await page.getByRole("menuitem", { name: "编辑" }).click();
}
