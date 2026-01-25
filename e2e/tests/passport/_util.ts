import { Page } from "@playwright/test";

export async function selectCaptcha(page: Page) {
  await page.locator(".captcha-img").first().click();
  await page.locator("div:nth-child(2) > .captcha-img").click();
  await page.locator("div:nth-child(3) > .captcha-img").click();

  await page.getByRole("button", { name: "确 定" }).click();
}
export async function loginByPassword(page: Page, emailOrUserId: string, password: string) {
  await page.getByRole("textbox", { name: "学号或邮箱" }).click();
  await page.getByRole("textbox", { name: "学号或邮箱" }).fill(emailOrUserId);
  await page.getByRole("textbox", { name: "密码" }).click();
  await page.getByRole("textbox", { name: "密码" }).fill(password);
  await page.getByRole("checkbox", { name: "我已在抖音关注 佳佳子_zZ" }).check();
  await page.getByRole("button", { name: "登 录" }).click();
  await selectCaptcha(page);
}
export async function loginByEmail(page: Page, email: string) {
  await page.getByRole("tab", { name: "邮箱验证码登录" }).click();
  await page.getByRole("textbox", { name: "填写邮箱", exact: true }).click();
  await page.getByRole("textbox", { name: "填写邮箱", exact: true }).fill(email);
  await page.getByRole("button", { name: "发送验证码" }).click();
  await selectCaptcha(page);

  await page.getByRole("textbox", { name: "填写邮箱验证码" }).click();
  await page.getByRole("textbox", { name: "填写邮箱验证码" }).fill("1234");
  await page.getByRole("checkbox", { name: "我已在抖音关注 佳佳子_zZ" }).check();
  await page.getByRole("button", { name: "登 录" }).click();
}
