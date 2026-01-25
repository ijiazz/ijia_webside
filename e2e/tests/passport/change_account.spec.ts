import { getAppUrlFromRoute, vioServerTest as test } from "@/fixtures/test.ts";

import { initAlice, loginGetToken } from "@/__mocks__/user.ts";
import { dbPool } from "@/db/client.ts";
import { deleteFrom } from "@asla/yoursql";
import { v } from "@/sql/utils.ts";
import { loginByPassword } from "./_util.ts";
import { LOGIN_REDIRECT_HOME_MATCH } from "../_utils/login_home.ts";
const { expect, beforeEach } = test;

test("修改密码", async function ({ page }) {
  const Alice = await initAlice();
  const token = await loginGetToken(Alice.email, Alice.password);
  const aliceNewPassword = "aliceNew";
  await page.goto(getAppUrlFromRoute("/profile/security", token));
  await page.locator("body").click();
  await page.getByRole("textbox", { name: "* 旧密码" }).click();
  await page.getByRole("textbox", { name: "* 旧密码" }).fill(Alice.password + "err");
  await page.getByRole("textbox", { name: "* 新密码" }).click();
  await page.getByRole("textbox", { name: "* 新密码" }).fill(aliceNewPassword);
  await page.getByRole("textbox", { name: "* 确认密码" }).click();
  await page.getByRole("textbox", { name: "* 确认密码" }).fill(aliceNewPassword);
  await page.getByRole("button", { name: "确认修改" }).click();

  await page.getByRole("textbox", { name: "* 旧密码" }).click();
  await page.getByRole("textbox", { name: "* 旧密码" }).fill(Alice.password);
  await page.getByRole("button", { name: "确认修改" }).click();

  await page.locator(".ant-avatar").click();
  await page.getByText("退出登录").click();

  await loginByPassword(page, Alice.email, aliceNewPassword);
  await expect(page, "登录后导航到首页").toHaveURL(LOGIN_REDIRECT_HOME_MATCH, {});
});

test("重置密码", async function ({ page }) {
  const Alice = await initAlice();
  await page.goto(getAppUrlFromRoute("/passport/login"));
  await page.getByRole("link", { name: "忘记密码" }).click();

  await page.getByRole("textbox", { name: "* 电子邮箱 :" }).fill(Alice.email);
  await page.getByRole("button", { name: "发送验证码" }).click();
  await page.locator(".captcha-img").first().click();
  await page.locator("div:nth-child(2) > .captcha-img").click();
  await page.locator("div:nth-child(3) > .captcha-img").click();
  await page.getByRole("button", { name: "确 定" }).click();
  await page.getByRole("textbox", { name: "* 邮件验证码 :" }).fill("1234");
  await page.getByRole("textbox", { name: "* 新密码 :" }).fill("new");
  await page.getByRole("textbox", { name: "* 确认密码 :" }).fill("new");
  await page.getByRole("button", { name: "确 认" }).click();
  await page.locator(".e2e-go-to-login").click();

  await loginByPassword(page, Alice.email, "new");
  await expect(page, "使用新密码成功登录").toHaveURL(LOGIN_REDIRECT_HOME_MATCH);
});

test("修改邮箱", async function ({ page }) {
  const Alice = await initAlice();
  const token = await loginGetToken(Alice.email, Alice.password);
  const changeEmail = "changenew@ijiazz.cn";
  await dbPool.execute(deleteFrom("public.user").where("email=" + v(changeEmail)));
  await page.goto(getAppUrlFromRoute("/profile/security", token));

  await page.getByRole("button", { name: "修 改" }).click();

  await page.getByRole("button", { name: "发送验证码" }).click();
  await page.locator(".captcha-img").first().click();
  await page.locator("div:nth-child(2) > .captcha-img").click();
  await page.locator("div:nth-child(3) > .captcha-img").click();

  await page.getByRole("button", { name: "确 定" }).click();
  await page.getByRole("textbox", { name: "* 验证码 :" }).fill("1234");
  await new Promise((r) => setTimeout(r, 500));
  await page.getByRole("button", { name: "下一步" }).click();
  await page.getByRole("textbox", { name: "* 新邮箱 :" }).fill(changeEmail);

  await page.getByRole("button", { name: "发送验证码" }).click();
  await page.locator(".captcha-img").first().click();
  await page.locator("div:nth-child(2) > .captcha-img").click();
  await page.locator("div:nth-child(3) > .captcha-img").click();

  await page.getByRole("button", { name: "确 定" }).click();
  await page.getByRole("textbox", { name: "* 验证码 :" }).fill("1234");
  await new Promise((r) => setTimeout(r, 500));
  await page.getByRole("button", { name: "确 认" }).click();

  await expect(page.locator(".e2e-current-user"), "断言输入框的值为修改后的邮箱").toHaveValue(changeEmail);
});
