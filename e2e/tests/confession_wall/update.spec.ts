import { getAppUrlFromRoute, vioServerTest as test } from "@/fixtures/test.ts";
import { getSelfPostRoute, initAlice, initBob, loginGetToken } from "@/utils/user.ts";
import { createPost } from "@/utils/post.ts";
import { Page } from "@playwright/test";

const { expect, beforeEach } = test;

test("修改内容", async function ({ page }) {
  const alice = await init(page);
  await page.goto(getAppUrlFromRoute(getSelfPostRoute(alice.id), alice.token));
  const postItems = page.locator(".e2e-post-item");
  const post0 = postItems.nth(0);

  const textLocator = post0.locator(".post-content-text").first();
  const text = await textLocator.textContent();
  await post0.getByRole("button", { name: "more" }).click();
  await page.getByText("编辑").click();

  const textArea = page.getByRole("textbox", { name: "* 发布内容 :" });

  await expect(textArea.textContent()).resolves.toBe(text);

  await textArea.fill("编辑后的内容");
  await page.getByRole("button", { name: "确 认" }).click();

  await expect(textLocator).toHaveText("编辑后的内容");
});

test("将作品可见状态修改", async function ({ page }) {
  const alice = await init(page);
  await page.goto(getAppUrlFromRoute(getSelfPostRoute(alice.id), alice.token));

  const post = page.locator(".e2e-post-item").nth(0);

  await post.getByRole("button", { name: "more" }).click();
  await page.getByText("设置").click();
  await page.getByRole("switch", { name: "仅自己可见 :" }).click();
  await page.getByRole("button", { name: "确 认" }).click();
  //TODO: 断言修改成功
});

async function init(page: Page) {
  const aliceInfo = await initAlice();
  const aliceToken = await loginGetToken(aliceInfo.email, aliceInfo.password);
  const alice = { ...aliceInfo, token: aliceToken };

  const bobInfo = await initBob();
  const bobToken = await loginGetToken(bobInfo.email, bobInfo.password);

  await createPost({ content_text: "alice" }, aliceToken);
  await createPost({ content_text: "bob" }, bobToken);

  return alice;
}
