import { getAppUrlFromRoute, vioServerTest as test } from "@/fixtures/test.ts";

import { dbPool } from "@/db/client.ts";
import { deleteFrom, select } from "@asla/yoursql";
import { v } from "@/sql/utils.ts";
const { expect } = test;

test("注册账号", async function ({ page }) {
  const email = "test_signup@ijiazz.cn";
  await dbPool.queryCount(deleteFrom("public.user").where("email=" + v(email)));

  await page.goto(getAppUrlFromRoute("/passport/signup"));

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
  await page.getByRole("textbox", { name: "* 邮件验证码 :" }).fill("12345"); // 测试模式邮件验证码一定是 1234, 这里测试错误
  await page.getByRole("textbox", { name: "* 密码 :" }).click();
  await page.getByRole("textbox", { name: "* 密码 :" }).fill("123");
  await page.getByRole("textbox", { name: "* 确认密码 :" }).click();
  await page.getByRole("textbox", { name: "* 确认密码 :" }).fill("123");
  await page.getByRole("checkbox", { name: "我已在抖音关注 佳佳子_zZ" }).check();
  await page.getByRole("button", { name: "提 交" }).click();

  await page.getByRole("textbox", { name: "* 邮件验证码 :" }).click();
  await page.getByRole("textbox", { name: "* 邮件验证码 :" }).fill("1234"); // 测试模式邮件验证码一定是 1234
  await page.getByRole("button", { name: "提 交" }).click();

  await expect(page, "注册成功后导航到个人配置页").toHaveURL(/\/profile\/center/, {});
  await page.waitForTimeout(500);
  await expect(page, "注册成功后导航到个人配置页").toHaveURL(/\/profile\/center/, {});

  await expect(
    dbPool.queryCount(
      select("*")
        .from("public.user")
        .where(`email=` + v(email)),
    ),
    "注册成功",
  ).resolves.toBe(1);
});
