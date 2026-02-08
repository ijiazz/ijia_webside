import { Page, BrowserContext } from "@playwright/test";
import { REQUEST_AUTH_KEY } from "@/api.ts";
import { env } from "@/playwright.config.ts";

export function changePageToMobile(page: Page) {
  return page.setViewportSize({ width: 375, height: 667 });
}

export async function setContextLogin(context: BrowserContext, accessToken: string) {
  const url = new URL(env.WEB_URL).origin;
  const expires = Math.floor(Date.now() / 1000) + 3600; // expires must be unix timestamp (seconds)
  await context.addCookies([{ name: REQUEST_AUTH_KEY, value: accessToken, url, expires }]);
}
