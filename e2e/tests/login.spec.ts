import { vioServerTest as test } from "@/fixtures/test.ts";
const { expect, beforeEach } = test;

test("访问首页", async function ({ page, webUrl }) {
  await page.goto(webUrl);
});
