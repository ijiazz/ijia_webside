import { vioServerTest as test } from "@/fixtures/test.ts";
import { AccountInfo, initAlice, initBob, loginGetToken } from "@/utils/user.ts";
import { createPost, getUserPostURL } from "@/utils/post.ts";
import { api, JWT_TOKEN_KEY } from "@/utils/fetch.ts";
import { DROPDOWN_ACTION_WAIT_TIME, setContextLogin } from "@/utils/browser.ts";

const { expect, beforeEach } = test;

let alice: AccountInfo & { token: string };
let bob: AccountInfo & { token: string };
let postId: number;

beforeEach(async function () {
  const aliceInfo = await initAlice();
  const aliceToken = await loginGetToken(aliceInfo.email, aliceInfo.password);
  alice = { ...aliceInfo, token: aliceToken };

  const bobInfo = await initBob();
  const bobToken = await loginGetToken(bobInfo.email, bobInfo.password);
  bob = { ...bobInfo, token: bobToken };

  const p = await createPost({ content_text: "alice" }, aliceToken);
  postId = p.id;
});

test("点赞自己和别人的评论", async function ({ page, context, browser }) {
  await createRootComment(postId, "comment", alice.token);
  await setContextLogin(context, alice.token);
  await page.goto(getUserPostURL(alice.id, { openCommentPostId: postId }));
  {
    //alice 点赞
    const firstBtn = page.getByRole("dialog").getByRole("button", { name: "heart" });
    await expect(firstBtn).toHaveText("0");
    await firstBtn.click();
    await expect(firstBtn).toHaveText("1");
  }

  const bobContext = await browser.newContext();
  await setContextLogin(bobContext, bob.token);
  const bobPage = await bobContext.newPage();
  {
    //bob 点赞
    const page = bobPage;

    await page.goto(getUserPostURL(alice.id, { openCommentPostId: postId }));

    const firstBtn = page.getByRole("dialog").getByRole("button", { name: "heart" });

    await expect(firstBtn).toHaveText("1");
    await firstBtn.click();
    await expect(firstBtn).toHaveText("2");
  }

  {
    //alice 取消点赞
    await page.reload();
    const firstBtn = page.getByRole("dialog").getByRole("button", { name: "heart" });
    await expect(firstBtn).toHaveText("2");
    await firstBtn.click();
    await expect(firstBtn).toHaveText("1");
  }
});

test("游客禁止点赞", async function ({ page }) {
  await createRootComment(postId, "comment", alice.token);
  await page.goto(getUserPostURL(alice.id, { openCommentPostId: postId }));
  const firstBtn = page.getByRole("dialog").getByRole("button", { name: "heart" });
  await expect(firstBtn).toBeDisabled();
});

test("举报评论", async function ({ page }) {
  await createRootComment(postId, "comment", alice.token);
  await page.goto(getUserPostURL(alice.id, { openCommentPostId: postId, access_token: alice.token }));
  await page.getByRole("dialog").getByRole("button", { name: "more" }).click();
  await page.getByText("举报", { exact: true }).click();
  await page.getByRole("combobox", { name: "* 举报理由 :" }).click();
  await page.getByTitle("辱骂").locator("div").click();
  await page.waitForTimeout(DROPDOWN_ACTION_WAIT_TIME);
  await page.getByRole("button", { name: "确 定" }).click();
  await expect(page.getByText("已举报", { exact: true })).toHaveCount(1);

  await page.getByRole("dialog").getByRole("button", { name: "more" }).click();
  await expect(page.getByRole("menuitem", { name: "warning 已举报" })).toBeDisabled();
});

function createRootComment(postId: number, content: string, token?: string) {
  return api["/post/comment/entity"].put({
    body: { text: content, postId },
    [JWT_TOKEN_KEY]: token,
  });
}
