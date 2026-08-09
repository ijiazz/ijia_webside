import { test, expect } from "@playwright/test";
import { MODAL_ACTION_WAIT_TIME, setContextLogin } from "@/utils/browser.ts";
import {
  DEFAULT_QUESTIONS,
  getExaminationAnswerURL,
  getExaminationDetailURL,
  getShelfExaminationListURL,
  prepareExamination,
  prepareExaminationTemplate,
  prepareUserExamination,
} from "@/utils/examination.ts";
import { initAlice, loginGetToken } from "@/utils/user.ts";

function getExamTitle(name: string) {
  return `e2e-${name}-${Math.floor(Math.random() * 10000)}`;
}

async function prepareAliceExam(name: string) {
  const alice = await initAlice();
  const aliceToken = await loginGetToken(alice.email, alice.password);
  const examTitle = getExamTitle(name);
  const { templateId } = await prepareExaminationTemplate(DEFAULT_QUESTIONS, { ownerId: alice.id });
  const examinationId = await prepareExamination({
    userId: alice.id,
    templateId,
    title: examTitle,
  });

  return { alice, aliceToken, examTitle, examinationId };
}

test("用户可以继续一场进行中的考试", async function ({ page, context }) {
  const { aliceToken, examTitle, examinationId } = await prepareAliceExam("继续考试");

  await setContextLogin(context, aliceToken);
  await page.goto(getExaminationDetailURL(examinationId));
  await page.getByRole("button", { name: "开始考试" }).click();
  await page.waitForTimeout(MODAL_ACTION_WAIT_TIME);
  await page.getByRole("button", { name: "确 定" }).click();

  await expect(page).toHaveURL(getExaminationAnswerURL(examinationId));

  await expect(page.getByText("考试题目-0")).toBeVisible();
  await page.getByRole("radio", { name: /选项-0/ }).check();
  await page.getByRole("button", { name: "提交并进入下一题" }).click();
  await expect(page.getByText("考试题目-1")).toBeVisible();

  await page.goto(getExaminationDetailURL(examinationId));
  await expect(page.getByRole("heading", { name: examTitle })).toBeVisible();
  await page.getByRole("button", { name: "继续考试" }).click();

  await expect(page).toHaveURL(getExaminationAnswerURL(examinationId));
  await expect(page.getByText("考试题目-1")).toBeVisible();
  await page.getByRole("radio", { name: /选项-0/ }).check();
  await page.getByRole("button", { name: "提交并进入下一题" }).click();
  await expect(page.getByText("考试题目-2")).toBeVisible();
});

test("用户可以删除自己的考试", async function ({ page, context }) {
  const { aliceToken, examTitle } = await prepareAliceExam("删除考试");

  await setContextLogin(context, aliceToken);
  await page.goto(getShelfExaminationListURL());

  const examItem = page
    .locator("div", { hasText: examTitle })
    .filter({ has: page.getByRole("button", { name: "删除" }) })
    .first();
  await expect(examItem).toBeVisible();
  await examItem.getByRole("button", { name: "删除" }).click();
  await page.waitForTimeout(MODAL_ACTION_WAIT_TIME);
  await page.getByRole("button", { name: "确 定" }).click();

  await expect(page.getByText("考试已删除")).toBeVisible();
  await expect(page.getByText(examTitle)).toBeHidden();

  await page.reload();
  await expect(page.getByText(examTitle)).toBeHidden();
});

test("未开始的考试展示暂未开始状态", async function ({ page, context }) {
  const alice = await initAlice();
  const aliceToken = await loginGetToken(alice.email, alice.password);
  const examTitle = getExamTitle("未开始考试");
  const examinationId = await prepareExamination({
    userId: alice.id,
    title: examTitle,
    allowTimeStart: new Date(Date.now() + 60 * 60 * 1000),
    allowTimeEnd: new Date(Date.now() + 2 * 60 * 60 * 1000),
  });

  await setContextLogin(context, aliceToken);
  await page.goto(getExaminationDetailURL(examinationId));

  await expect(page.getByRole("heading", { name: examTitle })).toBeVisible();
  await expect(page.getByText("考试暂未开始")).toBeVisible();
  await expect(page.getByText("请在允许开始时间之后进入考试。")).toBeVisible();
  await expect(page.getByRole("button", { name: "开始考试" })).toBeHidden();
});
test("用户可以关闭自动下一题后再开启自动下一题", async function ({ page, context }) {
  const alice = await initAlice();
  const aliceToken = await loginGetToken(alice.email, alice.password);
  const { examinationId } = await prepareUserExamination(alice.id, "切换自动下一题");

  await setContextLogin(context, aliceToken);
  await page.goto(getExaminationDetailURL(examinationId));
  await page.getByRole("button", { name: "开始考试" }).click();
  await page.waitForTimeout(MODAL_ACTION_WAIT_TIME);
  await page.getByRole("button", { name: "确 定" }).click();

  await expect(page).toHaveURL(getExaminationAnswerURL(examinationId));
  await expect(page.getByText("考试题目-0")).toBeVisible();
  await page.getByRole("checkbox", { name: "提交后自动开始下一题" }).uncheck();
  await page.getByRole("radio", { name: /选项-0/ }).check();
  await page.getByRole("button", { name: "提交答案" }).click();

  await expect(page.getByText("考试题目-0")).toBeVisible();
  await page.getByRole("button", { name: "下一题" }).click();

  await expect(page.getByText("考试题目-1")).toBeVisible();
  await page.getByRole("checkbox", { name: "提交后自动开始下一题" }).check();
  await page.getByRole("radio", { name: /选项-1/ }).check();
  await page.getByRole("button", { name: "提交并进入下一题" }).click();

  await expect(page.getByText("考试题目-2")).toBeVisible();
});
