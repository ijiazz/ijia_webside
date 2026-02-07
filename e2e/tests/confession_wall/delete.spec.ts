import { getAppUrlFromRoute, vioServerTest as test } from "@/fixtures/test.ts";
import { initAlice, initBob, loginGetToken } from "@/utils/user.ts";
import { createPost } from "@/utils/post.ts";
const { expect, beforeEach, beforeAll, describe } = test;

test("删除", async function ({ page }) {
  let aliceToken: string;
  {
    const aliceInfo = await initAlice();
    aliceToken = await loginGetToken(aliceInfo.email, aliceInfo.password);
    await createPost({ content_text: "content4" }, aliceToken);
    await createPost({ content_text: "content3" }, aliceToken);
    await createPost({ content_text: "content2" }, aliceToken);
    await createPost({ content_text: "content1" }, aliceToken);
  }

  await page.goto(getAppUrlFromRoute("/wall/list/self", aliceToken));

  const postItems = page.locator(".e2e-post-item");

  await expect(postItems).toHaveCount(4);

  await postItems.nth(2).getByRole("button", { name: "more" }).click();
  await page.getByRole("menuitem", { name: "删除" }).click();
  await page.getByRole("button", { name: "确 定" }).click();
  await expect(postItems.nth(2).getByLabel("content4")).toHaveCount(1);
  await postItems.nth(2).getByRole("button", { name: "more" }).click();
  await page.getByRole("menuitem", { name: "删除" }).click();
  await page.getByRole("button", { name: "确 定" }).click();

  await expect(postItems).toHaveCount(2);

  await page.getByRole("menuitem", { name: "全部" }).click();
  await expect(postItems).toHaveCount(2);
});

test("不能删除别人的内容", async function ({ page }) {
  const aliceInfo = await initAlice();
  const aliceToken = await loginGetToken(aliceInfo.email, aliceInfo.password);
  await createPost({ content_text: "alice" }, aliceToken);

  const bobInfo = await initBob();
  const bobToken = await loginGetToken(bobInfo.email, bobInfo.password);

  {
    await page.goto(getAppUrlFromRoute("/wall", bobToken));
    const postItems = page.locator(".e2e-post-item");
    await postItems.nth(0).getByRole("button", { name: "more" }).click();
    await expect(page.getByText("删除"), "看不到Alice作品的删除按钮").toHaveCount(0);
  }
});
