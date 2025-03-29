import { getAppUrlByRoute, vioServerTest as test } from "@/fixtures/test.ts";
const { expect, beforeEach } = test;

beforeEach(async function ({ page, context }) {
  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    downloadThroughput: 520 * 1024,
    uploadThroughput: 520 * 1024,
    latency: 180,
  });
});
test("首页", async function ({ page }) {
  await page.goto(getAppUrlByRoute("/"), { waitUntil: "networkidle" });
});
test("登录", async function ({ page }) {
  await page.goto(getAppUrlByRoute("/passport/login"), { waitUntil: "networkidle" });
});
