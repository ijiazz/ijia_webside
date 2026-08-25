import { test, expect, Page } from "@playwright/test";
import { initAlice, initBob, loginGetToken } from "@/utils/user.ts";
import { createPost, createCommentUseApi, getPostCommentURL, getUserPostURL } from "@/utils/post.ts";

import { afterTime } from "evlib";
import { MODAL_ACTION_WAIT_TIME, setContextLogin } from "@/utils/browser.ts";
import { closeCommentMenu, getCommentMoreBtn, getVisibleCommentMenu } from "@/utils/comment/locator.ts";

test("创建一条根评论，然后删除", async function ({ page, context }) {
  const alice = await initAlice();
  const aliceToken = await loginGetToken(alice.email);
  const { id: postId } = await createPost({ content_text: "comment-test" }, aliceToken);
  await setContextLogin(context, aliceToken);

  await page.goto(getUserPostURL(alice.id));

  await expect(getCommentBtn(page, postId), "帖子评论数初始为0").toHaveText("0");
  await getCommentBtn(page, postId).click();

  await page.getByRole("textbox").fill("e2e-c-1");
  await page.getByRole("button", { name: "发 送" }).click();

  await expect(page.locator(commentItemClassName, { hasText: "e2e-c-1" }), "评论被添加到列表中").toHaveCount(1);
  await page.reload();
  await expect(page.locator(commentItemClassName, { hasText: "e2e-c-1" }), "列表中有一个评论").toHaveCount(1);
  await expect(getCommentBtn(page, postId), "帖子评论数加1").toHaveText("1");

  await page.locator(".e2e-comment-item").getByRole("button", { name: "更多菜单" }).click();
  await page.getByText("删除").click();
  await page.waitForTimeout(MODAL_ACTION_WAIT_TIME);
  await page.getByRole("button", { name: "确 定" }).click({});

  await expect(page.locator(commentItemClassName, { hasText: "e2e-c-1" }), "列表评论被删除").toHaveCount(0);
  await page.reload();
  await expect(page.locator(commentItemClassName, { hasText: "e2e-c-1" }), "列表中不存在评论").toHaveCount(0);
  await expect(getCommentBtn(page, postId), "帖子评论数减1").toHaveText("0");
});

test("创建回复评论", async function ({ page, context }) {
  test.setTimeout(30000);
  const alice = await initAlice();
  const aliceToken = await loginGetToken(alice.email);
  const { id: postId } = await createPost({ content_text: "comment-test" }, aliceToken);
  await setContextLogin(context, aliceToken);

  await page.goto(getPostCommentURL({ postId, userId: alice.id }));
  // 先创建1条根评论
  await page.getByRole("textbox").fill("r1");
  await page.getByRole("button", { name: "发 送" }).click();

  await expect(page.getByRole("textbox"), "等待发送完成").toHaveValue("");
  // 先创建1条根评论
  await page.getByRole("textbox").fill("r2");
  await page.getByRole("button", { name: "发 送" }).click();

  await replyComment(page, "1-r2", "r1"); // 一级评论

  await replyComment(page, "2-r2", "r2"); // 一级评论
  await replyComment(page, "1-2-r2", "2-r2"); // 二级评论
  await replyComment(page, "1-1-2-r2", "1-2-r2"); // 三级评论

  await expect(page.locator(commentContentClassName).nth(4), "评论应出现在正确位置").toHaveText(/^1-2-r2/);
  await expect(page.locator(commentContentClassName).nth(5), "评论应出现在正确位置").toHaveText(/^1-1-2-r2/);

  await page.reload();

  await expect(getCommentBtn(page, postId), "帖子评论数为 6").toHaveText("6");

  await page.getByRole("button", { name: "展开1条回复" }).click();
  await page.getByRole("button", { name: "展开3条回复" }).click();
  await expect(page.locator(commentContentClassName).nth(4), "评论应出现在正确位置").toHaveText(/^1-2-r2/);
  await expect(page.locator(commentContentClassName).nth(5), "评论应出现在正确位置").toHaveText(/^1-1-2-r2/);
});

test("删除评论", async function ({ page, context }) {
  test.setTimeout(30000);
  const alice = await initAlice();
  const aliceToken = await loginGetToken(alice.email);
  const { id: postId, comment_tree_id: commentTreeId } = await createPost({ content_text: "comment-test" }, aliceToken);
  await setContextLogin(context, aliceToken);

  const r1 = await createCommentUseApi({ commentTreeId, text: "@1@", token: aliceToken });
  const r2 = await createCommentUseApi({ commentTreeId, text: "@2@", token: aliceToken }); // delete

  const r1_1 = await createCommentUseApi({ commentTreeId, text: "@1-1@", replyCommentId: r1.id, token: aliceToken }); // delete
  const r1_2 = await createCommentUseApi({ commentTreeId, text: "@1-2@", replyCommentId: r1.id, token: aliceToken });
  const r2_1 = await createCommentUseApi({ commentTreeId, text: "@2-1@", replyCommentId: r2.id, token: aliceToken });

  const r1_1_1 = await createCommentUseApi({
    commentTreeId,
    text: "@1-1-1@",
    replyCommentId: r1_1.id,
    token: aliceToken,
  });
  const r1_2_1 = await createCommentUseApi({
    commentTreeId,
    text: "@1-2-1@",
    replyCommentId: r1_2.id,
    token: aliceToken,
  });
  const r2_1_1 = await createCommentUseApi({
    commentTreeId,
    text: "@2-1-1@",
    replyCommentId: r2_1.id,
    token: aliceToken,
  }); // delete

  const r1_2_1_1 = await createCommentUseApi({
    commentTreeId,
    text: "@1-2-1-1@",
    replyCommentId: r1_2_1.id,
    token: aliceToken,
  }); // delete

  await page.goto(getPostCommentURL({ postId, userId: alice.id }));

  await page.getByRole("button", { name: "展开5条回复" }).click(); //r1
  await page.getByRole("button", { name: "展开2条回复" }).click(); //r2

  await expect(page.locator(commentContentClassName)).toHaveCount(9);
  await getCommentMoreBtn(page, r2.id).click(); // r2
  await page.getByText("删除").first().click();
  await page.waitForTimeout(MODAL_ACTION_WAIT_TIME);
  await page.getByRole("button", { name: "确 定" }).click();

  await expect(page.locator(commentContentClassName), "根评论被删除，它的所有子评论都应被删除").toHaveCount(6); // 只剩 r1

  await getCommentMoreBtn(page, r1_1.id).click(); // r1-1
  await page.getByText("删除").first().click();
  await page.waitForTimeout(MODAL_ACTION_WAIT_TIME);
  await page.getByRole("button", { name: "确 定" }).click();

  await getCommentMoreBtn(page, r1_2_1_1.id).click(); // r1-2-1-1
  await page.getByText("删除").first().click();
  await page.waitForTimeout(MODAL_ACTION_WAIT_TIME);
  await page.getByRole("button", { name: "确 定" }).click();

  await expect(page.locator(commentContentClassName), "根评论被删除，它的所有子评论都应被删除").toHaveCount(4);

  await page.reload();
  await expect(getCommentBtn(page, postId), "帖子评论数为 4").toHaveText("4");

  await page.getByRole("button", { name: "展开3条回复" }).click(); //r1

  await expect(page.locator(commentContentClassName).nth(2)).toHaveText(/^@1-1-1@/);
  await expect(page.locator(commentHeaderClassName).nth(2), "回复的父级已被删除").toHaveText(/已删除/);
  await expect(page.locator(commentContentClassName).nth(3)).toHaveText(/^@1-2-1@/);
});

test("帖子作者可以删除其他人评论，其他人只能删除自己的评论", async function ({ page, context }) {
  const alice = await initAlice();
  const aliceToken = await loginGetToken(alice.email);
  const { id: postId, comment_tree_id: commentTreeId } = await createPost({ content_text: "comment-test" }, aliceToken);
  await setContextLogin(context, aliceToken);

  const bobInfo = await initBob();
  const bobToken = await loginGetToken(bobInfo.email);
  const [aliceComment, bobComment] = await Promise.all([
    createCommentUseApi({ commentTreeId, text: "@1@", token: aliceToken }),
    createCommentUseApi({ commentTreeId, text: "@2@", token: bobToken }),
  ]);

  {
    await page.goto(getPostCommentURL({ postId, userId: alice.id }));
    await getCommentMoreBtn(page, aliceComment.id).hover();
    await expect(getVisibleCommentMenu(page)).toBeVisible();
    await expect(
      getVisibleCommentMenu(page).getByRole("menuitem").filter({ hasText: "删除" }),
      "Alice 能看到自己的评论的“删除”按钮",
    ).not.toBeDisabled();
    await closeCommentMenu(page);

    await getCommentMoreBtn(page, bobComment.id).hover();
    await expect(getVisibleCommentMenu(page)).toBeVisible();
    await expect(
      getVisibleCommentMenu(page).getByRole("menuitem").filter({ hasText: "删除" }),
      "Alice 能看到 Bob 的评论的“删除”按钮",
    ).not.toBeDisabled();
    await closeCommentMenu(page);
  }
  {
    await setContextLogin(context, bobToken);
    await page.goto(getPostCommentURL({ postId, userId: alice.id }));
    await getCommentMoreBtn(page, aliceComment.id).hover();
    await expect(getVisibleCommentMenu(page)).toBeVisible();
    await expect(
      getVisibleCommentMenu(page).getByRole("menuitem").filter({ hasText: "删除" }),
      "Bob 不能看到 Alice 的评论的“删除”按钮",
    ).toHaveCount(0);
    await closeCommentMenu(page);

    await getCommentMoreBtn(page, bobComment.id).hover();
    await expect(getVisibleCommentMenu(page)).toBeVisible();
    await expect(
      getVisibleCommentMenu(page).getByRole("menuitem").filter({ hasText: "删除" }),
      "Bob 的评论的“删除”按钮",
    ).not.toBeDisabled();
    await closeCommentMenu(page);
  }
});

test("切换不同帖子的评论区时显示对应评论", async function ({ page, context }) {
  const alice = await initAlice();
  const aliceToken = await loginGetToken(alice.email);
  const [firstPost, secondPost] = await Promise.all([
    createPost({ content_text: "comment-switch-first" }, aliceToken),
    createPost({ content_text: "comment-switch-second" }, aliceToken),
  ]);
  const [firstComment, secondComment] = await Promise.all([
    createCommentUseApi({ commentTreeId: firstPost.comment_tree_id, text: "first-post-comment", token: aliceToken }),
    createCommentUseApi({ commentTreeId: secondPost.comment_tree_id, text: "second-post-comment", token: aliceToken }),
  ]);
  await setContextLogin(context, aliceToken);

  await page.goto(getUserPostURL(alice.id));
  await expect(page.getByTestId(`post-${firstPost.id}`)).toBeVisible();
  await expect(page.getByTestId(`post-${secondPost.id}`)).toBeVisible();

  await getCommentBtn(page, firstPost.id).click();
  const commentDialog = page.getByRole("dialog", { name: "评论" });
  await expect(commentDialog.getByTestId(`comment-${firstComment.id}`).locator(commentContentClassName)).toHaveText(
    /^first-post-comment/,
  );
  await expect(commentDialog.locator(commentContentClassName)).toHaveCount(1);

  await commentDialog.getByRole("button", { name: "关闭" }).click();
  await expect(commentDialog).not.toBeVisible();

  await getCommentBtn(page, secondPost.id).click();
  await expect(commentDialog.getByTestId(`comment-${secondComment.id}`).locator(commentContentClassName)).toHaveText(
    /^second-post-comment/,
  );
  await expect(commentDialog.locator(commentContentClassName)).toHaveCount(1);
});

const commentItemClassName = ".e2e-comment-item";
const commentContentClassName = ".e2e-comment-content";
const commentHeaderClassName = ".e2e-comment-header";

function getCommentBtn(page: Page, postId: number) {
  return page.getByTestId(`post-${postId}`).getByRole("button", { name: "打开评论" });
}
async function replyComment(page: Page, replyText: string, filterText: string) {
  await expect(page.getByRole("textbox"), "等待发送完成").toHaveValue("");

  await page
    .locator("div")
    .filter({ hasText: new RegExp(`^${filterText}`) })
    .getByRole("button", { name: "回复" })
    .click(); // 点击回复按钮

  await page.getByRole("textbox").fill(replyText);
  await expect(page.getByRole("button", { name: "发 送" }), "发送按钮应该可用").not.toBeDisabled();
  await afterTime(200);
  await page.getByRole("button", { name: "发 送" }).click();
}
