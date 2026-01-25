import { getAppUrlFromRoute, vioServerTest as test } from "@/fixtures/test.ts";

import { initAlice, loginGetToken, initBob } from "@/__mocks__/user.ts";
import { loginByEmail, loginByPassword } from "./_util.ts";
const { expect, beforeEach } = test;

test("学号加密码登录", async function ({ page }) {
  const user = await initAlice();
  await page.goto(getAppUrlFromRoute("/passport/login"));
  await loginByPassword(page, user.id.toString(), user.password);
  await expect(page, "登录后导航到首页").toHaveURL(/\/live/, {});
});
test("邮箱加密码登录", async function ({ page, browser }) {
  const user = await initAlice();
  await page.goto(getAppUrlFromRoute("/passport/login"));
  await loginByPassword(page, user.email, user.password);
  await expect(page, "登录后导航到首页").toHaveURL(/\/live/, {});
});
test("邮箱验证码码登录", async function ({ page, browser }) {
  const user = await initAlice();
  await page.goto(getAppUrlFromRoute("/passport/login"));
  await loginByEmail(page, user.email);
  await expect(page, "登录后导航到首页").toHaveURL(/\/live/, {});
});
test("切换账号", async function ({ page }) {
  const Alice = await initAlice();
  const Bob = await initBob();
  const token = await loginGetToken(Alice.email, Alice.password);
  await page.goto(getAppUrlFromRoute("/profile/center", token));

  await expect(page.locator(".student-card-id")).toHaveText("学号：" + Alice.id.toString());
  await page.locator(".e2e-avatar").hover();
  await page.getByText("退出登录").click();

  await loginByPassword(page, Bob.email, Bob.password);
  await expect(page, "登录后导航到首页").toHaveURL(/\/live/, {});
});
