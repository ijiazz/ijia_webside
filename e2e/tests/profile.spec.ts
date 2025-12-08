import { getAppUrlFromRoute, vioServerTest as test } from "@/fixtures/test.ts";
import { AccountInfo, initAlice, loginGetToken } from "@/__mocks__/user.ts";
import { dclass, pla_user, Platform, PUBLIC_CLASS_ROOT_ID } from "@ijia/data/db";
import { Page } from "@playwright/test";
import { deleteFrom, v } from "@asla/yoursql";
import { dbPool } from "@/db/client.ts";
import { insertIntoValues } from "@/sql/utils.ts";
const { expect, beforeEach, beforeAll, describe } = test;

let Alice!: AccountInfo;
let users: { user_name: string; sec_uid: string }[];
beforeEach(async ({ page }) => {
  Alice = await initAlice();
  const aliceToken = await loginGetToken(Alice.email, Alice.password);

  const res = await dbPool.queryRows(
    insertIntoValues(
      pla_user.name,
      [
        {
          pla_uid: "alice",
          platform: Platform.douYin,
          user_name: "Alice",
          extra: { sec_uid: "sec_alice" },
          signature: `IJIA学号：<${Alice.id}>`,
        },
        {
          pla_uid: "bob",
          platform: Platform.douYin,
          user_name: "Bob",
          extra: { sec_uid: "sec_bob" },
          signature: `IJIA学号：<${Alice.id}>`,
        },
      ].map((item) => {
        const uuid = crypto.randomUUID().replaceAll("-", "");
        return {
          ...item,
          pla_uid: item.pla_uid + ":" + uuid,
          extra: { ...item.extra, sec_uid: item.extra.sec_uid + ":" + uuid },
        };
      }),
    ).returning(["pla_uid", "platform", "user_name", "extra"]),
  );

  users = res.map((u) => ({ user_name: u.user_name, sec_uid: u.extra.sec_uid }));

  // 账号绑定

  await page.goto(getAppUrlFromRoute("/profile/center", aliceToken));
});
test("账号绑定与解除关联", async function ({ page, browser }) {
  await clearPublicClass();
  await initPublicClass();
  const bob = users.find((u) => u.user_name === "Bob")!;
  const alice = users.find((u) => u.user_name === "Alice")!;
  await addBind(page, bob.sec_uid);
  await expect(page.locator(".student-card-body .student-card-name")).toHaveText("姓名：Bob");

  await addBind(page, alice.sec_uid);

  await page.locator(".ant-avatar-group").getByText("Alice").hover();
  await page.getByRole("button", { name: "同步用户信息" }).click();
  await expect(page.locator(".student-card-body .student-card-name")).toHaveText("姓名：Alice");

  await page.getByRole("button", { name: "解除关联" }).click();
  await page.getByRole("button", { name: "确 定" }).click();

  await expect(page.locator(".bind-list").locator(".ant-avatar-group>span"), "Alice 已被解除").toHaveCount(1);

  await page.getByRole("checkbox", { name: "年度评论统计 question-circle" }).check();
  await page.getByRole("combobox", { name: "班级 question-circle :" }).click();
  await page.getByText("e2e-8").click();

  await page.getByRole("button", { name: "保 存" }).click();
  await expect(page.locator(".student-card-body").first()).toHaveText(/e2e-8/);

  await page.locator(".ant-avatar-group").getByText("Bob").hover();
  await page.getByRole("button", { name: "解除关联" }).click();
  await page.getByRole("button", { name: "确 定" }).click();

  await expect(page.getByRole("checkbox", { name: "年度评论统计 question-circle" })).toBeDisabled();
  await expect(
    page.getByRole("checkbox", { name: "年度评论统计 question-circle" }),
    "全部解除关联后，年度评论统计功能被禁用",
  ).not.toBeChecked();
});

test("修改基础配置", async function ({ page, browser }) {
  await clearPublicClass();
  await initPublicClass();
  const bob = users.find((u) => u.user_name === "Bob")!;
  await addBind(page, bob.sec_uid);
  // 修改基础配置
  await page.locator(".ant-select-selection-search").click();
  await page
    .locator("div")
    .filter({ hasText: /^e2e-8$/ })
    .nth(1)
    .click();
  await page.getByRole("checkbox", { name: "年度评论统计 question-circle" }).check();
  await page.getByRole("button", { name: "保 存" }).click();
  await page.reload();

  await expect(page.locator(".student-card-body").first()).toHaveText(/e2e-8/);
  await expect(page.getByRole("checkbox", { name: "年度评论统计 question-circle" })).toBeChecked();
});

async function addBind(page: Page, sec_id: string) {
  await page.getByRole("button", { name: "plus 添加绑定" }).click();
  await page.getByRole("textbox", { name: "输入抖音个人首页连接" }).click();
  await page.getByRole("textbox", { name: "输入抖音个人首页连接" }).fill("https://www.douyin.com/user/" + sec_id);
  await page.getByRole("button", { name: "检 测" }).click();
  await page.getByRole("button", { name: "绑 定" }).click();
}

async function clearPublicClass() {
  await dbPool.execute(deleteFrom(dclass.name).where("parent_class_id=" + v(PUBLIC_CLASS_ROOT_ID)));
}
async function initPublicClass() {
  await dbPool.execute(
    insertIntoValues(dclass.name, [
      { class_name: "e2e-8", parent_class_id: PUBLIC_CLASS_ROOT_ID },
      { class_name: "e2e-1", parent_class_id: PUBLIC_CLASS_ROOT_ID },
    ]),
  );
}
