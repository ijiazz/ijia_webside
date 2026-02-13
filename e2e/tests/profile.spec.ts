import { vioServerTest as test } from "@/fixtures/test.ts";
import { createDouyinUser, initContextLogged, ProfileCenterURL } from "@/utils/user.ts";
import { Page } from "@playwright/test";
const { expect } = test;
const classOptionClassName = ".e2e-class-option";
test("账号绑定与解除关联", async function ({ page, context }) {
  const Alice = await initContextLogged(context);
  const bob = await createDouyinUser({
    user_name: "Bob",
    signature: `IJIA学号：<${Alice.id}>`,
  });
  const alice = await createDouyinUser({
    user_name: "Alice",
    signature: `IJIA学号：<${Alice.id}>`,
  });

  await page.goto(ProfileCenterURL);

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
  await page.locator(classOptionClassName).getByText("e2e-8").click();

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

test("修改基础配置", async function ({ page, context }) {
  const Alice = await initContextLogged(context);
  await page.goto(ProfileCenterURL);

  const bob = await createDouyinUser({
    user_name: "Bob",
    signature: `IJIA学号：<${Alice.id}>`,
  });
  await addBind(page, bob.sec_uid);
  // 修改基础配置
  await page.getByRole("combobox", { name: "班级 question-circle :" }).click();
  await page.locator(classOptionClassName).getByText("e2e-8").click();
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
