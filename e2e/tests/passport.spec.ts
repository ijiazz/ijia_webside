import { getAppUrlByRouter, vioServerTest as test } from "@/fixtures/test.ts";
import { user } from "@ijia/data/db";
import { initAlice, createOverwriteUser, loginGetToken, initBob } from "@/__mocks__/user.ts";
import { v } from "@ijia/data/yoursql";
import { Page } from "@playwright/test";
const { expect, beforeEach } = test;

test("注册账号", async function ({ page, webInfo }) {
  const email = "test_signup@ijiazz.cn";
  await user.delete({ where: "email=" + v(email) }).queryCount();

  await page.goto(getAppUrlByRouter("/passport/signup"));

  await page.getByRole("textbox", { name: "* 电子邮箱 :" }).click();
  await page.getByRole("textbox", { name: "* 电子邮箱 :" }).fill(email);
  await page.getByRole("button", { name: "发送验证码" }).click();

  await page.locator("div:nth-child(1) > .captcha-img").click(); // 模拟选错
  await page.getByRole("button", { name: "确 定" }).click();

  await page.getByRole("button", { name: "刷 新" }).click(); // 模拟刷新
  await page.locator("div:nth-child(1) > .captcha-img").click();
  await page.locator("div:nth-child(2) > .captcha-img").click();
  await page.locator("div:nth-child(3) > .captcha-img").click();
  await page.getByRole("button", { name: "确 定" }).click();

  await page.getByRole("textbox", { name: "* 邮件验证码 :" }).click();
  await page.getByRole("textbox", { name: "* 邮件验证码 :" }).fill("1234"); // 测试模式邮件验证码一定是 1234
  await page.getByRole("textbox", { name: "* 密码 :" }).click();
  await page.getByRole("textbox", { name: "* 密码 :" }).fill("123");
  await page.getByRole("textbox", { name: "* 确认密码 :" }).click();
  await page.getByRole("textbox", { name: "* 确认密码 :" }).fill("123");
  await page.getByRole("button", { name: "提 交" }).click();

  await expect(page, "注册成功后导航到个人配置页").toHaveURL(/profile/, {});
  await expect(
    user
      .select("*")
      .where(`email=` + v(email))
      .queryCount(),
    "注册成功",
  ).resolves.toBe(1);
});
test("学号登录", async function ({ page }) {
  const user = await initAlice();
  await page.goto(getAppUrlByRouter("/passport/login"));
  await page.getByRole("textbox", { name: "学号或邮箱" }).click();
  await page.getByRole("textbox", { name: "学号或邮箱" }).fill(user.id.toString());
  await page.getByRole("textbox", { name: "密码" }).click();
  await page.getByRole("textbox", { name: "密码" }).fill(user.password);
  await page.getByRole("button", { name: "登 录" }).click();
  await selectCaptcha(page);

  await expect(page, "注册成功后导航到个人配置页").toHaveURL(/\/live/, {});
});
test("邮箱登录", async function ({ page, browser }) {
  const user = await initAlice();
  await page.goto(getAppUrlByRouter("/passport/login"));
  await page.getByRole("textbox", { name: "学号或邮箱" }).click();
  await page.getByRole("textbox", { name: "学号或邮箱" }).fill(user.email);
  await page.getByRole("textbox", { name: "密码" }).click();
  await page.getByRole("textbox", { name: "密码" }).fill(user.password);
  await page.getByRole("button", { name: "登 录" }).click();
  await selectCaptcha(page);
  await expect(page, "注册成功后导航到个人配置页").toHaveURL(/\/live/, {});
});
test("切换账号", async function ({ page }) {
  const Alice = await initAlice();
  const Bob = await initBob();
  const token = await loginGetToken(Alice.email, Alice.password);
  await page.goto(getAppUrlByRouter("/profile/center", token));

  await expect(page.getByText("学号： " + Alice.id.toString())).toBeVisible();
  await page.locator(".e2e-avatar").hover();
  await page.getByText("退出登录").click();

  await page.getByRole("textbox", { name: "学号或邮箱" }).click();
  await page.getByRole("textbox", { name: "学号或邮箱" }).fill(Bob.email);
  await page.getByRole("textbox", { name: "密码" }).click();
  await page.getByRole("textbox", { name: "密码" }).fill(Bob.password);
  await page.getByRole("button", { name: "登 录" }).click();
  await selectCaptcha(page);
});
async function selectCaptcha(page: Page) {
  await page.locator(".captcha-img").first().click();
  await page.locator("div:nth-child(2) > .captcha-img").click();
  await page.locator("div:nth-child(3) > .captcha-img").click();

  await page.getByRole("button", { name: "确 定" }).click();
}
