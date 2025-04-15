import { getAppUrlFromRoute, vioServerTest as test } from "@/fixtures/test.ts";
import { AccountInfo, initAlice, loginGetToken } from "@/__mocks__/user.ts";
import { dclass, pla_user, Platform, PUBLIC_CLASS_ROOT_ID } from "@ijia/data/db";
import { Page } from "@playwright/test";
import v from "@ijia/data/yoursql";
const { expect, beforeEach, beforeAll, describe } = test;

let Alice!: AccountInfo;
beforeEach(async ({ page }) => {
  Alice = await initAlice();
  const aliceToken = await loginGetToken(Alice.email, Alice.password);
  await page.goto(getAppUrlFromRoute("/profile/center", aliceToken));
});
test("账号绑定", async function ({ page, browser }) {
  await pla_user.delete({ where: "pla_uid in ('alice','bob','david')" }).queryCount();
  await pla_user
    .insert([
      {
        pla_uid: "alice",
        platform: Platform.douYin,
        user_name: "Alice",
        extra: { sec_uid: "sec_alice" },
        signature: `IJIA学号：<${Alice.id}>`,
      },
      {
        pla_uid: "bob",
        platform: Platform.douYin,
        user_name: "Bob",
        extra: { sec_uid: "sec_bob" },
        signature: `IJIA学号：<${Alice.id}>`,
      },
      { pla_uid: "david", platform: Platform.douYin, user_name: "Alice", extra: { sec_uid: "sec_david" } },
    ])
    .queryCount();
  await dclass.delete({ where: "parent_class_id=" + v(PUBLIC_CLASS_ROOT_ID) }).queryCount();
  await dclass
    .insert([
      { class_name: "e2e-8", parent_class_id: PUBLIC_CLASS_ROOT_ID },
      { class_name: "e2e-1", parent_class_id: PUBLIC_CLASS_ROOT_ID },
    ])
    .query();
  // 账号绑定

  await addBind(page, "sec_bob");
  await expect(page.locator(".student-card-body")).toHaveText(/Bob/);

  await addBind(page, "sec_alice");

  await page.locator(".ant-avatar-group").getByText("Alice").hover();
  await page.getByRole("button", { name: "同步用户信息" }).click();
  await expect(page.locator(".student-card-body")).toHaveText(/Alice/);

  await page.getByRole("button", { name: "解除关联" }).click();
  await page.getByRole("button", { name: "确 定" }).click();

  await expect(page.locator(".bind-list").locator(".ant-avatar-group>span"), "Alice 已被解除").toHaveCount(1);

  // 修改基础配置
  await page.locator(".ant-select-selection-search").click();
  await page
    .locator("div")
    .filter({ hasText: /^e2e-8$/ })
    .nth(1)
    .click();
  await page.getByRole("checkbox", { name: "年度评论统计 question-circle" }).check();
  await page.getByRole("button", { name: "保 存" }).click();
  await page.reload();

  await expect(page.locator(".student-card-body")).toHaveText(/e2e-8/);
  await expect(page.getByRole("checkbox", { name: "年度评论统计 question-circle" })).toBeChecked();

  await page.locator(".ant-avatar-group").getByText("Bob").hover();
  await page.getByRole("button", { name: "解除关联" }).click();
  await page.getByRole("button", { name: "确 定" }).click();

  await expect(page.getByRole("checkbox", { name: "年度评论统计 question-circle" })).toBeDisabled();

  async function addBind(page: Page, sec_id: string) {
    await page.getByRole("button", { name: "plus 添加绑定" }).click();
    await page.getByRole("textbox", { name: "输入抖音个人首页连接" }).click();
    await page.getByRole("textbox", { name: "输入抖音个人首页连接" }).fill("https://www.douyin.com/user/" + sec_id);
    await page.getByRole("button", { name: "检 测" }).click();
    await page.getByRole("button", { name: "绑 定" }).click();
  }
});
