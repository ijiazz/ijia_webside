import { test, expect } from "@playwright/test";
import { MODAL_ACTION_WAIT_TIME, setContextLogin } from "@/utils/browser.ts";
import {
  DEFAULT_QUESTIONS,
  getExaminationAnswerURL,
  getExaminationURL,
  prepareExamination,
  prepareExaminationTemplate,
} from "@/utils/examination.ts";
import { initAlice, loginGetToken } from "@/utils/user.ts";

function getExamTitle(name: string) {
  return `e2e-${name}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
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

test("用户可以完成一场考试并查看作答记录", async function ({ page, context }) {
  const { aliceToken, examTitle, examinationId } = await prepareAliceExam("完整考试流程");

  await setContextLogin(context, aliceToken);
  await page.goto(getExaminationURL());

  const examItem = page
    .locator("div", { hasText: examTitle })
    .filter({ has: page.getByRole("link", { name: "查看" }) })
    .first();
  await expect(page.getByText(examTitle), "考试列表应展示准备好的考试").toBeVisible();
  await examItem.getByRole("link", { name: "查看" }).click();

  await expect(page).toHaveURL(getExaminationURL(examinationId));
  await expect(page.getByRole("heading", { name: examTitle })).toBeVisible();
  await expect(
    page.locator(".ant-descriptions-row", { hasText: "题目总数" }).getByText("3", { exact: true }),
  ).toBeVisible();

  await page.getByRole("button", { name: "开始考试" }).click();
  await page.waitForTimeout(MODAL_ACTION_WAIT_TIME);
  await page.getByRole("button", { name: "确 定" }).click();

  await expect(page).toHaveURL(getExaminationAnswerURL(examinationId));
  await expect(page.getByText("第1题，")).toBeVisible();
  await expect(page.getByText("考试题目-0")).toBeVisible();

  await page.getByRole("radio", { name: /A\.\s*选项-0/ }).check();
  await page.getByRole("button", { name: "提交并进入下一题" }).click();
  await expect(page.getByText("考试题目-1")).toBeVisible();

  await page.getByRole("button", { name: "跳过此题" }).click();
  await page.waitForTimeout(MODAL_ACTION_WAIT_TIME);
  await page.getByRole("button", { name: "确 定" }).click();
  await expect(page.getByText("考试题目-2")).toBeVisible();

  await page.getByRole("radio", { name: /A\.\s*选项-0/ }).check();
  await page.getByRole("button", { name: "提交并进入下一题" }).click();
  await expect(page.getByText("当前没有更多未提交题目，可以直接交卷")).toBeVisible();

  await page.getByRole("button", { name: "交 卷" }).click();
  await page.waitForTimeout(MODAL_ACTION_WAIT_TIME);
  await page.getByRole("button", { name: "确 定" }).click();

  await expect(page).toHaveURL(getExaminationURL(examinationId));
  await expect(page.getByText("作答记录", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "查看第1题作答记录" })).toBeVisible();
  await expect(page.getByRole("button", { name: "查看第2题作答记录" })).toBeVisible();
  await expect(page.getByRole("button", { name: "查看第3题作答记录" })).toBeVisible();
});

test("用户可以继续一场进行中的考试", async function ({ page, context }) {
  const { aliceToken, examTitle, examinationId } = await prepareAliceExam("继续考试");

  await setContextLogin(context, aliceToken);
  await page.goto(getExaminationURL(examinationId));
  await page.getByRole("button", { name: "开始考试" }).click();
  await page.waitForTimeout(MODAL_ACTION_WAIT_TIME);
  await page.getByRole("button", { name: "确 定" }).click();

  await expect(page).toHaveURL(getExaminationAnswerURL(examinationId));
  await expect(page.getByText("考试题目-0")).toBeVisible();
  await page.getByRole("radio", { name: /A\.\s*选项-0/ }).check();
  await page.getByRole("button", { name: "提交并进入下一题" }).click();
  await expect(page.getByText("考试题目-1")).toBeVisible();

  await page.goto(getExaminationURL(examinationId));
  await expect(page.getByRole("heading", { name: examTitle })).toBeVisible();
  await page.getByRole("button", { name: "继续考试" }).click();

  await expect(page).toHaveURL(getExaminationAnswerURL(examinationId));
  await expect(page.getByText("考试题目-1")).toBeVisible();
});

test("用户可以删除自己的考试", async function ({ page, context }) {
  const { aliceToken, examTitle } = await prepareAliceExam("删除考试");

  await setContextLogin(context, aliceToken);
  await page.goto(getExaminationURL());

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
  await page.goto(getExaminationURL(examinationId));

  await expect(page.getByRole("heading", { name: examTitle })).toBeVisible();
  await expect(page.getByText("考试暂未开始")).toBeVisible();
  await expect(page.getByText("请在允许开始时间之后进入考试。")).toBeVisible();
  await expect(page.getByRole("button", { name: "开始考试" })).toBeHidden();
});
