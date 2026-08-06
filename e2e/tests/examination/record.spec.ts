import { test, expect } from "@playwright/test";
import type { TemplateQuestionInput } from "@ijia/api-types/test";
import { ExamQuestionType } from "@ijia/api-types";
import { MODAL_ACTION_WAIT_TIME, setContextLogin } from "@/utils/browser.ts";
import {
  getExaminationAnswerURL,
  getExaminationURL,
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

  const aliceToken = await loginGetToken(alice.email, alice.password);
  await setContextLogin(context, aliceToken);
  await page.goto(getExaminationURL());

  const examItem = page
    .locator("div", { hasText: examTitle })
    .filter({ has: page.getByRole("link", { name: "查看" }) })
    .first();
  await examItem.getByRole("link", { name: "查看" }).click();

  await expect(page).toHaveURL(getExaminationURL(examinationId));

  await page.getByRole("button", { name: "开始考试" }).click();
  await page.waitForTimeout(MODAL_ACTION_WAIT_TIME);
  await page.getByRole("button", { name: "确 定" }).click();

  await expect(page).toHaveURL(getExaminationAnswerURL(examinationId));

  await page.getByRole("radio", { name: /选项-0/ }).check();
  await page.getByRole("button", { name: "提交并进入下一题" }).click();
  await expect(page.getByText("考试题目-1")).toBeVisible();

  await page.getByRole("radio", { name: /选项-0/ }).check();
  await afterTime(1000);
  await page.getByRole("button", { name: "提交并进入下一题" }).click();
  await expect(page.getByText("考试题目-2")).toBeVisible();

  await page.getByRole("radio", { name: /选项-0/ }).check();
  await page.getByRole("button", { name: "提交并进入下一题" }).click();

  await expect(page.getByText("当前没有更多未提交题目，可以直接交卷")).toBeVisible();
  await page.getByRole("button", { name: "交 卷" }).click();
  await page.waitForTimeout(MODAL_ACTION_WAIT_TIME);
  await page.getByRole("button", { name: "确 定" }).click();

  await expect(page).toHaveURL(getExaminationURL(examinationId));
});
