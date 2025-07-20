import { getAppUrlFromRoute, vioServerTest as test } from "@/fixtures/test.ts";
import { AccountInfo, initAlice, initBob, loginGetToken } from "@/__mocks__/user.ts";
import { clearPosts, clearPostGroup, createPostGroup, createPost } from "./utils/post.ts";
import { Locator } from "@playwright/test";

const { expect, beforeAll } = test;

let alice: AccountInfo & { token: string };
let bob: AccountInfo & { token: string };

beforeAll(async function () {
  await clearPosts();

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

test("举报帖子", async function ({ page }) {
  await page.goto(getAppUrlFromRoute("/wall", alice.token));
  await page.getByRole("button", { name: "more" }).first().click();
  await page.getByText("举报", { exact: true }).click();
  await page.getByRole("combobox", { name: "* 举报理由 :" }).click();
  await page.getByTitle("辱骂").locator("div").click();
  await page.getByRole("button", { name: "确 定" }).click();
  await expect(page.getByText("已举报", { exact: true })).toHaveCount(1);

  await page.getByRole("button", { name: "more" }).first().click();
  await expect(page.getByRole("menuitem", { name: "warning 已举报" })).toBeDisabled();
});

function getLikeBtn(locator: Locator) {
  return locator.locator(".e2e-post-item-like-btn");
}
