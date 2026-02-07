import { getAppUrlFromRoute, vioServerTest as test } from "@/fixtures/test.ts";
import { initAlice, initBob, loginGetToken } from "@/utils/user.ts";
import { createPost } from "@/utils/post.ts";
import { Page } from "@playwright/test";

const { expect, beforeEach } = test;

test("修改内容", async function ({ page }) {
  const alice = await init(page);
  await page.goto(getAppUrlFromRoute("/wall", alice.token));
  const postItems = page.locator(".e2e-post-item");

  const textLocator = postItems.nth(1).locator(".post-content-text").first();
  const text = await textLocator.textContent();
  await postItems.nth(1).getByRole("button", { name: "more" }).click();
  await page.getByText("编辑").click();

  const textArea = page.getByRole("textbox", { name: "* 发布内容 :" });

  await expect(textArea.textContent()).resolves.toBe(text);

  await textArea.fill("编辑后的内容");
  await page.getByRole("button", { name: "确 认" }).click();

  await expect(textLocator).toHaveText("编辑后的内容");
});

test("不能修改别人的内容", async function ({ page }) {
  const alice = await init(page);
  await page.goto(getAppUrlFromRoute("/wall", alice.token));

  const postItems = page.locator(".e2e-post-item");
  await postItems.nth(0).getByRole("button", { name: "more" }).click();

  await expect(page.getByText("编辑")).toHaveCount(0);
  await expect(page.getByText("设置")).toHaveCount(0);
});

test("将作品可见状态修改", async function ({ page }) {
  const alice = await init(page);
  await page.goto(getAppUrlFromRoute("/wall", alice.token));

  const postItems = page.locator(".e2e-post-item");

  await expect(postItems).toHaveCount(2);

  await page.getByText("我的").click();
  await expect(postItems).toHaveCount(1);

  await postItems.nth(0).getByRole("button", { name: "more" }).click();
  await page.getByText("设置").click();
  await page.getByRole("switch", { name: "仅自己可见 :" }).click();
  await page.getByRole("button", { name: "确 认" }).click();

  await page.getByText("全部").click();
  await expect(postItems).toHaveCount(1);
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
