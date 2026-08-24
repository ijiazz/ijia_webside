import { test } from "@playwright/test";
import { initAlice, initBob, loginGetToken } from "@/utils/user.ts";
import { createPost } from "@/utils/post.ts";
import { DROPDOWN_ACTION_WAIT_TIME, setContextLogin } from "@/utils/browser.ts";
import { getAppURLFromRoute } from "@/utils/app.ts";
import { runAfterResponse } from "@/utils/request.ts";

const { expect } = test;

test("点赞自己和别人的帖子", async function ({ page, context, browser }) {
  const aliceInfo = await initAlice();
  const aliceToken = await loginGetToken(aliceInfo.email);
  const alice = { ...aliceInfo, token: aliceToken };

  const bobInfo = await initBob();
  const bobToken = await loginGetToken(bobInfo.email);
  const bob = { ...bobInfo, token: bobToken };

  const alicePost = await createPost({ content_text: "alice" }, aliceToken);

  await setContextLogin(context, alice.token);
  await page.goto(getAppURLFromRoute("/wall/list", { userId: bob.id }));
  // 前置条件

  const postItem = page.getByTestId(`post-${alicePost.id}`);
  const likeBtn = postItem.getByRole("button", { name: "点赞" });
  const cancelLikeBtn = postItem.getByRole("button", { name: "取消点赞" });
  {
    //alice 点赞自己的帖子
    await expect(likeBtn).toHaveText("0");
    await runAfterResponse({ page, matcher: likeRequestMatcher, action: () => likeBtn.click() });

    await expect(cancelLikeBtn).toHaveText("1");
  }

  {
    await using bobContext = await browser.newContext();
    const page = await bobContext.newPage();
    await setContextLogin(bobContext, bob.token);
    await page.goto(getAppURLFromRoute("/wall/list", { userId: alice.id }));

    //bob 点赞别人的帖子

    const postItem = page.getByTestId(`post-${alicePost.id}`);
    const likeBtn = postItem.getByRole("button", { name: "点赞" });

    await expect(likeBtn).toHaveText("1");

    await runAfterResponse({ page, matcher: likeRequestMatcher, action: () => likeBtn.click() });
    await expect(postItem.getByRole("button", { name: "取消点赞" })).toHaveText("2");
  }

  {
    //alice 取消点赞
    await page.reload();
    await expect(cancelLikeBtn).toHaveText("2");
    await runAfterResponse({ page, matcher: likeRequestMatcher, action: () => cancelLikeBtn.click() });
    await expect(likeBtn).toHaveText("1");
  }
});

test("游客禁止点赞", async function ({ page }) {
  const bobInfo = await initBob();
  const bobToken = await loginGetToken(bobInfo.email);
  const bob = { ...bobInfo, token: bobToken };

  const post = await createPost({ content_text: "bob" }, bobToken);
  await page.goto(getAppURLFromRoute("/wall/list", { userId: bob.id }));
  await expect(page.getByTestId(`post-${post.id}`).getByRole("button", { name: "点赞" })).toBeDisabled();
});

test("举报帖子", async function ({ page }) {
  const aliceInfo = await initAlice();
  const aliceToken = await loginGetToken(aliceInfo.email);
  const alice = { ...aliceInfo, token: aliceToken };

  const bobInfo = await initBob();
  const bobToken = await loginGetToken(bobInfo.email);
  const bob = { ...bobInfo, token: bobToken };

  await createPost({ content_text: "bob" }, bobToken);

  await setContextLogin(page.context(), alice.token);
  await page.goto(getAppURLFromRoute("/wall/list", { userId: bob.id }));
  // 前置条件

  await page.getByRole("button", { name: "more" }).first().click();
  await page.getByText("举报", { exact: true }).click();
  await page.getByRole("combobox", { name: "* 举报理由 :" }).click();
  await page.getByTitle("辱骂").locator("div").click();
  await page.waitForTimeout(DROPDOWN_ACTION_WAIT_TIME);
  await page.getByRole("button", { name: "确 定" }).click();
  await expect(page.getByText("已举报", { exact: true })).toHaveCount(1);

  await page.getByRole("button", { name: "more" }).first().click();
  await expect(page.getByRole("menuitem", { name: "warning 已举报" })).toBeDisabled();
});

const likeRequestMatcher = /\/post\/entity\/\d+\/like/;
