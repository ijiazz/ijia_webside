import { Page } from "@playwright/test";

export function changePageToMobile(page: Page) {
  return page.setViewportSize({ width: 375, height: 667 });
}
