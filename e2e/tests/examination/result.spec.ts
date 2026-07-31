import { test, expect, Page } from "@playwright/test";
import { ExamQuestionType } from "@ijia/api-types";
import {
  answerNextExaminationQuestion,
  endExamination,
  getExaminationResult,
  getExaminationURL,
  prepareUserExamination,
  startExamination,
} from "@/utils/examination.ts";
import { setContextLogin } from "@/utils/browser.ts";
import { initAlice, loginGetToken } from "@/utils/user.ts";

async function expectStatistic(page: Page, title: string, value: string) {
  const statistic = page.locator(".ant-statistic", { hasText: title });
  await expect(statistic.getByText(value, { exact: true })).toBeVisible();
}

test("用户可以查看得分、正确、错误和未答题情况", async function ({ page, context }) {
  const alice = await initAlice();
  const aliceToken = await loginGetToken(alice.email, alice.password);
  const { examinationId, title } = await prepareUserExamination(alice.id, "结果统计", [
    {
      question_type: ExamQuestionType.SingleChoice,
      answer_index: [0],
      score: 2,
      option_map: [1, 0, 2, 3],
    },
    {
      question_type: ExamQuestionType.SingleChoice,
      answer_index: [0],
      score: 2,
    },
    {
      question_type: ExamQuestionType.SingleChoice,
      answer_index: [0],
      score: 2,
    },
  ]);

  await startExamination(aliceToken, examinationId);
  await answerNextExaminationQuestion(aliceToken, examinationId, [1]);
  await answerNextExaminationQuestion(aliceToken, examinationId, [1]);
  await endExamination(aliceToken, examinationId);

  await expect
    .poll(async () => getExaminationResult(aliceToken, examinationId))
    .toMatchObject({
      grade: 2,
      correct_number: 1,
      partially_correct_number: 0,
      wrong_number: 1,
      unanswered_number: 1,
    });

  await setContextLogin(context, aliceToken);
  await page.goto(getExaminationURL(examinationId));

  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await expectStatistic(page, "成绩", "2");
  await expectStatistic(page, "正确", "1");
  await expectStatistic(page, "错误", "1");
  await expectStatistic(page, "未作答", "1");
  await expect(page.getByRole("button", { name: "查看第1题作答记录" })).toBeVisible();
  await expect(page.getByRole("button", { name: "查看第2题作答记录" })).toBeVisible();
});
