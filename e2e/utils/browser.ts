import { Page, BrowserContext } from "@playwright/test";
import { REQUEST_AUTH_KEY } from "@/api.ts";
import { env } from "@/playwright.config.ts";

export function changePageToMobile(page: Page) {
  return page.setViewportSize({ width: 375, height: 667 });
}

export async function setContextLogin(context: BrowserContext, accessToken: string) {
  const domain = new URL(env.WEB_URL).host;
  await context.addCookies([{ name: REQUEST_AUTH_KEY, value: accessToken, domain: domain, path: "/" }]);
}
