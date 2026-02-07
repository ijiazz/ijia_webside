import { getAppUrlFromRoute, vioServerTest as test } from "@/fixtures/test.ts";
import { AccountInfo, initAlice, loginGetToken } from "@/utils/user.ts";
import { changePageToMobile } from "@/utils/browser.ts";
const { expect, beforeAll, describe } = test;

describe("默认组", function () {
  let alice: AccountInfo & { token: string };
  beforeAll(async function () {
    const aliceInfo = await initAlice();
    const aliceToken = await loginGetToken(aliceInfo.email, aliceInfo.password);
    alice = { ...aliceInfo, token: aliceToken };
  });

  test("发布一条普通帖子", async function ({ page }) {
    await page.goto(getAppUrlFromRoute("/wall", alice.token));
    await page.getByRole("button", { name: "edit 说点什么" }).click();
    await page.getByRole("textbox", { name: "* 发布内容 :" }).click();
    await page.getByRole("textbox", { name: "* 发布内容 :" }).fill("一条普通帖子");
    await page.getByRole("button", { name: "发 布" }).click();

    await expect(page, "发布成功后重定向到个人页").toHaveURL(getAppUrlFromRoute("/wall/list/self"));

    const postItems = page.locator(".e2e-post-item");
    await expect(postItems.first().getByText("一条普通帖子")).toBeVisible();

    await page.getByRole("menuitem", { name: "分组1" }).click();
    await expect(postItems, "分组下不应显示这个普通帖子").toHaveCount(0);

    await page.getByRole("menuitem", { name: "全部" }).click();
    await expect(postItems.first().getByText("一条普通帖子")).toBeVisible();
  });

  test("移动端发布一条普通帖子", async function ({ page }) {
    await page.goto(getAppUrlFromRoute("/wall", alice.token));
    await changePageToMobile(page);

    await page.locator(".e2e-publish-post-btn").click();
    await page.getByRole("textbox", { name: "* 发布内容" }).click();
    await page.getByRole("textbox", { name: "* 发布内容" }).fill("一条移动端普通帖子");
    await page.getByRole("button", { name: "发 布" }).click();

    await expect(page, "发布成功后重定向到个人页").toHaveURL(getAppUrlFromRoute("/wall/list/self"));

    const postItems = page.locator(".e2e-post-item");
    await expect(postItems.first().getByText("一条移动端普通帖子")).toBeVisible();
  });
  test("在个人页下发布帖子，发布后应该能看到刚刚发布的帖子", async function ({ page }) {
    await page.goto(getAppUrlFromRoute("/wall/list/self", alice.token));
    await page.getByRole("button", { name: "edit 说点什么" }).click();
    await page.getByRole("textbox", { name: "* 发布内容 :" }).click();
    await page.getByRole("textbox", { name: "* 发布内容 :" }).fill("在个人页下发布的帖子");
    await page.getByRole("button", { name: "发 布" }).click();

    const postItems = page.locator(".e2e-post-item");
    await expect(postItems.first().getByText("在个人页下发布的帖子")).toBeVisible();
  });
  test("发布一条表白帖子", async function ({ page }) {
    await page.goto(getAppUrlFromRoute("/wall/publish", alice.token));

    await page.getByText("分组1").click();
    await page.getByRole("textbox", { name: "* 发布内容" }).fill("一条表白帖子");
    await page.getByRole("button", { name: "发 布" }).click();
    await expect(page, "发布成功后重定向到个人页").toHaveURL(getAppUrlFromRoute("/wall/list/self"));

    const postItems = page.locator(".e2e-post-item");

    const firstItem = postItems.first();
    await expect(firstItem.getByText("一条表白帖子")).toBeVisible();
    await expect(firstItem.locator(".ant-tag").getByText("分组1")).toBeVisible();
    await expect(firstItem.locator(".ant-tag").getByText("审核中")).toBeVisible();

    await page.getByRole("menuitem", { name: "全部" }).click();
    await expect(postItems, "此时审核中，不应在全部栏看到这个帖子").toHaveCount(0);
  });

  test("发布一条仅自己可见的帖子，应仅自己在个人分栏下看见", async function ({ page }) {
    await page.goto(getAppUrlFromRoute("/wall", alice.token));
    await page.getByRole("button", { name: "edit 说点什么" }).click();
    await page.getByRole("textbox", { name: "* 发布内容 :" }).click();
    await page.getByRole("textbox", { name: "* 发布内容 :" }).fill("仅自己可见的帖子");
    await page.getByRole("switch", { name: "仅自己可见 :" }).click();
    await page.getByRole("button", { name: "发 布" }).click();
    await expect(page, "发布成功后重定向到个人页").toHaveURL(getAppUrlFromRoute("/wall/list/self"));

    const postItems = page.locator(".e2e-post-item");
    await expect(postItems.first().getByText("仅自己可见的帖子")).toBeVisible();

    await page.getByRole("menuitem", { name: "全部" }).click();
    await expect(postItems, "仅自己可见的帖子不能在全部栏看到").toHaveCount(0);
  });

  test("匿名发布，不应带名字", async function ({ page }) {
    await page.goto(getAppUrlFromRoute("/wall", alice.token));
    await page.getByRole("button", { name: "edit 说点什么" }).click();
    await page.getByRole("textbox", { name: "* 发布内容 :" }).click();
    await page.getByRole("textbox", { name: "* 发布内容 :" }).fill("仅自己可见的帖子");
    await page.getByRole("switch", { name: "匿名发布 :" }).click();
    await page.getByRole("button", { name: "发 布" }).click();
    await expect(page, "发布成功后重定向到个人页").toHaveURL(getAppUrlFromRoute("/wall/list/self"));
    const postItems = page.locator(".e2e-post-item");
    await expect(postItems.first().locator(".ant-tag").getByText("匿名")).toBeVisible();
  });

  test("未登录用户点击发布因重定向到登录页", async function ({ page }) {
    await page.goto(getAppUrlFromRoute("/wall"));
    await page.getByRole("button", { name: "edit 说点什么" }).click();

    await expect(page, "重定向到登录页").toHaveURL(/\/passport\/login/);

    await changePageToMobile(page);
    await page.goto(getAppUrlFromRoute("/wall"));
    await page.locator(".e2e-publish-post-btn").click();
    await expect(page, "重定向到登录页").toHaveURL(/\/passport\/login/);
  });
});
test("分组超过4个时，选择分组应显示下拉框", async function ({ page }) {
  await page.goto(getAppUrlFromRoute("/wall/publish"));

  await page.getByRole("combobox", { name: "内容分类 :" }).click();
  await page.getByTitle("分组4").locator("div").click();
  await page.getByRole("textbox", { name: "* 发布内容" }).fill("一条表白帖子");
});
