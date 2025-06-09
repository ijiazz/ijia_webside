import { getAppUrlFromRoute, vioServerTest as test } from "@/fixtures/test.ts";
import { AccountInfo, initAlice, initBob, loginGetToken } from "@/__mocks__/user.ts";
import { clearPosts, clearPostGroup, createPostGroup, createPost } from "./utils/post.ts";
import { Locator } from "@playwright/test";

const { expect, beforeAll } = test;

let alice: AccountInfo & { token: string };
let bob: AccountInfo & { token: string };

beforeAll(async function () {
  await clearPosts();
  await clearPostGroup();
  await createPostGroup("发布分组测试", "发布分组测试");

  const aliceInfo = await initAlice();
  const aliceToken = await loginGetToken(aliceInfo.email, aliceInfo.password);
  alice = { ...aliceInfo, token: aliceToken };

  const bobInfo = await initBob();
  const bobToken = await loginGetToken(bobInfo.email, bobInfo.password);
  bob = { ...bobInfo, token: bobToken };

  await createPost({ content_text: "alice" }, aliceToken);
  await createPost({ content_text: "bob" }, bobToken);
});

test("点赞自己和别人的帖子", async function ({ page, context, browser }) {
  await page.goto(getAppUrlFromRoute("/wall", alice.token));

  {
    //alice 点赞
    const firstBtn = getLikeBtn(page.locator(".ant-list-item").first());

    await expect(firstBtn).toHaveText("0");
    await firstBtn.click();
    await expect(firstBtn).toHaveText("1");
  }

  const bobContext = await browser.newContext();
  const bobPage = await bobContext.newPage();
  {
    //bob 点赞
    const page = bobPage;
    await page.goto(getAppUrlFromRoute("/wall", bob.token));

    const firstBtn = getLikeBtn(page.locator(".ant-list-item").first());

    await expect(firstBtn).toHaveText("1");
    await firstBtn.click();
    await expect(firstBtn).toHaveText("2");
  }

  {
    //alice 取消点赞
    await page.reload();
    const firstBtn = getLikeBtn(page.locator(".ant-list-item").first());
    await expect(firstBtn).toHaveText("2");
    await firstBtn.click();
    await expect(firstBtn).toHaveText("1");
  }

  //   await postItems.first().locator();
});

test("游客禁止点赞", async function ({ page }) {
  await page.goto(getAppUrlFromRoute("/wall"));
  const firstBtn = getLikeBtn(page.locator(".ant-list-item").first());
  await expect(firstBtn).toBeDisabled();
});
function getLikeBtn(locator: Locator) {
  return locator.locator(".e2e-post-item-like-btn");
}
