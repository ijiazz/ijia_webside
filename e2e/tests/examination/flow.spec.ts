import { test, expect, type Page } from "@playwright/test";
import { ExamQuestionType } from "@ijia/api-types";
import { MODAL_ACTION_WAIT_TIME, setContextLogin } from "@/utils/browser.ts";
import {
  getExaminationAnswerURL,
  getExaminationURL,
  prepareExamination,
  prepareExaminationTemplate,
} from "@/utils/examination.ts";
import { initAlice, loginGetToken } from "@/utils/user.ts";

const FULL_FLOW_QUESTIONS = [
  { question_type: ExamQuestionType.TrueOrFalse, answer_index: [1] },
  { question_type: ExamQuestionType.TrueOrFalse, answer_index: [0] },
  { question_type: ExamQuestionType.SingleChoice, answer_index: [0] },
  { question_type: ExamQuestionType.SingleChoice, answer_index: [1] },
  { question_type: ExamQuestionType.MultipleChoice, answer_index: [0, 2] },
  { question_type: ExamQuestionType.MultipleChoice, answer_index: [1, 3] },
  { question_type: ExamQuestionType.MultipleChoice, answer_index: [0, 3] },
];

function statisticLocator(page: Page, title: string) {
  return page.locator(".ant-statistic", { hasText: title }).first().locator(".ant-statistic-content-value");
}

function descriptionLocator(page: Page, title: string) {
  return page.locator(".ant-descriptions-item", { hasText: title }).locator(".ant-descriptions-item-content");
}

test("用户可以完成一场考试并查看作答记录", async function ({ page, context }) {
  const alice = await initAlice();
  const aliceToken = await loginGetToken(alice.email, alice.password);
  const examTitle = "完整考试流程";
  const { templateId } = await prepareExaminationTemplate(FULL_FLOW_QUESTIONS, { ownerId: alice.id });
  const examinationId = await prepareExamination({
    userId: alice.id,
    templateId,
    title: examTitle,
  });

  await setContextLogin(context, aliceToken);
  await page.goto(getExaminationURL());

  const examItem = page
    .locator("div", { hasText: examTitle })
    .filter({ has: page.getByRole("link", { name: "查看" }) })
    .first();
  await expect(page.getByText(examTitle), "考试列表应展示准备好的考试").toBeVisible();
  await examItem.getByRole("link", { name: "查看" }).click();

  await expect(page).toHaveURL(getExaminationURL(examinationId));
  await expect(descriptionLocator(page, "题目总数")).toContainText(FULL_FLOW_QUESTIONS.length.toString());

  await page.getByRole("button", { name: "开始考试" }).click();
  await page.waitForTimeout(MODAL_ACTION_WAIT_TIME);
  await page.getByRole("button", { name: "确 定" }).click();

  await expect(page).toHaveURL(getExaminationAnswerURL(examinationId));
  await expect(page.getByText("第1题，")).toBeVisible();

  await expect(page.getByText("考试题目-0")).toBeVisible();
  await expect(page.getByText("判断题")).toBeVisible();
  await page.getByText("✅正确").click();
  await page.getByRole("button", { name: "提交并进入下一题" }).click();

  await expect(page.getByText("考试题目-1")).toBeVisible();
  await expect(page.getByText("判断题")).toBeVisible();
  await page.getByRole("button", { name: "跳过此题" }).click();
  await page.waitForTimeout(MODAL_ACTION_WAIT_TIME);
  await page.getByRole("button", { name: "确 定" }).click();

  await expect(page.getByText("考试题目-2")).toBeVisible();
  await expect(page.getByText("单选题")).toBeVisible();
  await page.getByRole("radio", { name: /选项-0/ }).check();
  await page.getByRole("button", { name: "提交并进入下一题" }).click();

  await expect(page.getByText("考试题目-3")).toBeVisible();
  await expect(page.getByText("单选题")).toBeVisible();
  await page.getByRole("radio", { name: /选项-0/ }).check();
  await page.getByRole("button", { name: "提交并进入下一题" }).click();

  await expect(page.getByText("考试题目-4")).toBeVisible();
  await expect(page.getByText("多选题")).toBeVisible();
  await page.getByRole("checkbox", { name: /选项-0/ }).click();
  await page.getByRole("checkbox", { name: /选项-2/ }).click();
  await page.getByRole("button", { name: "提交并进入下一题" }).click();

  await expect(page.getByText("考试题目-5")).toBeVisible();
  await expect(page.getByText("多选题")).toBeVisible();
  await page.getByRole("checkbox", { name: /选项-0/ }).click();
  await page.getByRole("checkbox", { name: /选项-1/ }).click();
  await page.getByRole("button", { name: "提交并进入下一题" }).click();

  await expect(page.getByText("考试题目-6")).toBeVisible();
  await expect(page.getByText("多选题")).toBeVisible();
  await page.getByRole("checkbox", { name: /选项-0/ }).click();
  await page.getByRole("button", { name: "提交并进入下一题" }).click();

  await expect(page.getByText("当前没有更多未提交题目，可以直接交卷")).toBeVisible();
  await page.getByRole("button", { name: "交 卷" }).click();
  await page.waitForTimeout(MODAL_ACTION_WAIT_TIME);
  await page.getByRole("button", { name: "确 定" }).click();

  await expect(page).toHaveURL(getExaminationURL(examinationId));
  await expect(statisticLocator(page, "成绩")).toContainText("5");
  await expect(statisticLocator(page, "正确")).toContainText("3");
  await expect(statisticLocator(page, "部分正确")).toContainText("1");
  await expect(statisticLocator(page, "错误")).toContainText("2");
  await expect(statisticLocator(page, "未作答")).toContainText("1");
  await expect(page.getByText("作答记录", { exact: true })).toBeVisible();
});
