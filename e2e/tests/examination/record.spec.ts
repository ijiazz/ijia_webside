import { test, expect } from "@playwright/test";
import type { TemplateQuestionInput } from "@ijia/api-types/test";
import { ExamQuestionType } from "@ijia/api-types";
import { MODAL_ACTION_WAIT_TIME, setContextLogin } from "@/utils/browser.ts";
import {
  getExaminationAnswerURL,
  getExaminationDetailURL,
  getShelfExaminationListURL,
  prepareExamination,
  prepareExaminationTemplate,
} from "@/utils/examination.ts";
import { initAlice, initBob, loginGetToken } from "@/utils/user.ts";
import { afterTime } from "evlib";

test("作答记录信息展示", async function ({ page, context }) {
  const bob = await initBob();
  const alice = await initAlice();

  const examTitle = "完整考试流程";
  const FULL_FLOW_QUESTIONS: TemplateQuestionInput[] = [
    {
      question_type: ExamQuestionType.SingleChoice,
      answer_index: [0],
      difficulty_level: 1,
      user_id: bob.id,
      answer_text: "答案解析文本",
    },
    { question_type: ExamQuestionType.SingleChoice, answer_index: [0], difficulty_level: 5, time_limit: 1 },
    { question_type: ExamQuestionType.SingleChoice, answer_index: [0] },
  ];
  const { templateId } = await prepareExaminationTemplate(FULL_FLOW_QUESTIONS, { ownerId: alice.id });
  const examinationId = await prepareExamination({
    userId: alice.id,
    templateId,
    title: examTitle,
  });

  const aliceToken = await loginGetToken(alice.email);
  await setContextLogin(context, aliceToken);
  await page.goto(getShelfExaminationListURL());

  const examItem = page
    .locator("div", { hasText: examTitle })
    .filter({ has: page.getByRole("link", { name: "查看" }) })
    .first();
  await examItem.getByRole("link", { name: "查看" }).click();

  await expect(page).toHaveURL(getExaminationDetailURL(examinationId));

  await page.getByRole("button", { name: "开始考试" }).click();
  await page.waitForTimeout(MODAL_ACTION_WAIT_TIME);
  await page.getByRole("button", { name: "确 定" }).click();
  {
    await expect(page).toHaveURL(getExaminationAnswerURL(examinationId));

    await page.getByRole("radio", { name: /选项-0/ }).check();
    await page.getByRole("button", { name: "提交并进入下一题" }).click();
    await expect(page.getByText("考试题目-1")).toBeVisible();

    await page.getByRole("radio", { name: /选项-0/ }).check();
    await afterTime(2000);
    await page.getByRole("button", { name: "提交并进入下一题" }).click();
    await expect(page.getByText("考试题目-2")).toBeVisible();

    await page.getByRole("radio", { name: /选项-0/ }).check();
    await page.getByRole("button", { name: "提交并进入下一题" }).click();

    await expect(page.getByText("当前没有更多未提交题目，可以直接交卷")).toBeVisible();
    await page.getByRole("button", { name: "交 卷" }).click();
    await page.waitForTimeout(MODAL_ACTION_WAIT_TIME);
    await page.getByRole("button", { name: "确 定" }).click();
  }

  await expect(page).toHaveURL(getExaminationDetailURL(examinationId));

  const userAvatar = page.getByTestId("question-0").getByRole("link");
  await expect(userAvatar, "用户链接应打开到用户主页").toHaveAttribute("href", `/user/${bob.id}/post`);

  await expect(page.getByTestId("question-0").getByText("用时："), "应显示用时").toHaveText(
    /用时：\d{2}:\d{2}:\d{2}\.\d{3}/,
  );

  await expect(page.getByTestId("question-0").locator(".ant-rate"), "第1题难度为1颗星").toHaveAttribute(
    "aria-label",
    "1颗星",
  );
  await expect(page.getByTestId("question-1").locator(".ant-rate"), "第2题难度为5颗星").toHaveAttribute(
    "aria-label",
    "5颗星",
  );

  await page.getByTestId("question-0").getByRole("button", { name: "答案解析" }).click();

  await expect(page.getByTestId("question-0").getByLabel("答案解析文本"), "应显示答案解析").toBeVisible();

  await expect(page.getByTestId("question-1").getByText("超时"), "题目超时").toBeVisible();
});
test("未开放成绩", async function ({ page, context }) {
  const alice = await initAlice();

  const examTitle = "完整考试流程";
  const FULL_FLOW_QUESTIONS: TemplateQuestionInput[] = [
    { question_type: ExamQuestionType.SingleChoice, answer_index: [0] },
    { question_type: ExamQuestionType.SingleChoice, answer_index: [0] },
  ];
  const { templateId } = await prepareExaminationTemplate(FULL_FLOW_QUESTIONS, { ownerId: alice.id });
  const examinationId = await prepareExamination({
    userId: alice.id,
    templateId,
    title: examTitle,
    resultAllowViewDate: new Date(Date.now() + 1000 * 60 * 60 * 24),
  });

  const aliceToken = await loginGetToken(alice.email);
  await setContextLogin(context, aliceToken);
  await page.goto(getShelfExaminationListURL());

  const examItem = page
    .locator("div", { hasText: examTitle })
    .filter({ has: page.getByRole("link", { name: "查看" }) })
    .first();
  await examItem.getByRole("link", { name: "查看" }).click();

  await expect(page).toHaveURL(getExaminationDetailURL(examinationId));

  await page.getByRole("button", { name: "开始考试" }).click();
  await page.waitForTimeout(MODAL_ACTION_WAIT_TIME);
  await page.getByRole("button", { name: "确 定" }).click();
  {
    await expect(page).toHaveURL(getExaminationAnswerURL(examinationId));

    await page.getByRole("radio", { name: /选项-0/ }).check();
    await page.getByRole("button", { name: "提交并进入下一题" }).click();
    await expect(page.getByText("考试题目-1")).toBeVisible();

    await page.getByRole("radio", { name: /选项-0/ }).check();
    await page.getByRole("button", { name: "提交并进入下一题" }).click();

    await expect(page.getByText("当前没有更多未提交题目，可以直接交卷")).toBeVisible();
    await page.getByRole("button", { name: "交 卷" }).click();
    await page.waitForTimeout(MODAL_ACTION_WAIT_TIME);
    await page.getByRole("button", { name: "确 定" }).click();
  }

  await expect(page).toHaveURL(getExaminationDetailURL(examinationId));
  await expect(page.getByText("考试已结束，等待结果开放")).toBeVisible();

  await page.goto(getExaminationDetailURL(examinationId));
});
