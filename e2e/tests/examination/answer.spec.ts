import { test, expect } from "@playwright/test";
import { ExamQuestionType } from "@ijia/api-types";
import { MODAL_ACTION_WAIT_TIME, setContextLogin } from "@/utils/browser.ts";
import { getExaminationAnswerURL, getExaminationURL, prepareUserExamination } from "@/utils/examination.ts";
import { initAlice, loginGetToken } from "@/utils/user.ts";

test("用户可以正确作答单选题、多选题和判断题", async function ({ page, context }) {
  const alice = await initAlice();
  const aliceToken = await loginGetToken(alice.email, alice.password);
  const { examinationId } = await prepareUserExamination(alice.id, "混合题型作答", [
    {
      question_type: ExamQuestionType.SingleChoice,
      answer_index: [0],
      option_map: [2, 0, 1, 3],
    },
    {
      question_type: ExamQuestionType.MultipleChoice,
      answer_index: [0, 2],
      option_map: [1, 3, 0, 2],
    },
    { question_type: ExamQuestionType.TrueOrFalse, answer_index: [1] },
  ]);

  await setContextLogin(context, aliceToken);
  await page.goto(getExaminationURL(examinationId));
  await page.getByRole("button", { name: "开始考试" }).click();
  await page.waitForTimeout(MODAL_ACTION_WAIT_TIME);
  await page.getByRole("button", { name: "确 定" }).click();

  await expect(page).toHaveURL(getExaminationAnswerURL(examinationId));
  await expect(page.getByText("单选题")).toBeVisible();
  await page.getByRole("radio", { name: /选项-0/ }).check();
  await page.getByRole("button", { name: "提交并进入下一题" }).click();

  await expect(page.getByText("多选题")).toBeVisible();
  await page.getByRole("checkbox", { name: /选项-0/ }).click();
  await page.getByRole("checkbox", { name: /选项-2/ }).click();
  await page.getByRole("button", { name: "提交并进入下一题" }).click();

  await expect(page.getByText("判断题")).toBeVisible();
  await page.getByText("✅正确").click();
  await page.getByRole("button", { name: "提交并进入下一题" }).click();

  await expect(page.getByText("当前没有更多未提交题目，可以直接交卷")).toBeVisible();
});

test("用户可以关闭自动下一题后再开启自动下一题", async function ({ page, context }) {
  const alice = await initAlice();
  const aliceToken = await loginGetToken(alice.email, alice.password);
  const { examinationId } = await prepareUserExamination(alice.id, "切换自动下一题");

  await setContextLogin(context, aliceToken);
  await page.goto(getExaminationURL(examinationId));
  await page.getByRole("button", { name: "开始考试" }).click();
  await page.waitForTimeout(MODAL_ACTION_WAIT_TIME);
  await page.getByRole("button", { name: "确 定" }).click();

  await expect(page).toHaveURL(getExaminationAnswerURL(examinationId));
  await expect(page.getByText("考试题目-0")).toBeVisible();
  await page.getByRole("checkbox", { name: "提交后自动开始下一题" }).uncheck();
  await page.getByRole("radio", { name: /A\.\s*选项-0/ }).check();
  await page.getByRole("button", { name: "提交答案" }).click();

  await expect(page.getByText("考试题目-0")).toBeVisible();
  await expect(page.getByRole("button", { name: "下一题" })).toBeVisible();
  await page.getByRole("button", { name: "下一题" }).click();

  await expect(page.getByText("考试题目-1")).toBeVisible();
  await page.getByRole("checkbox", { name: "提交后自动开始下一题" }).check();
  await page.getByRole("radio", { name: /B\.\s*选项-1/ }).check();
  await page.getByRole("button", { name: "提交并进入下一题" }).click();

  await expect(page.getByText("考试题目-2")).toBeVisible();
});
