import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

export function getCommentMoreBtn(page: Page, commentId: number | string) {
  return page.getByTestId(`comment-header-${commentId}`).getByRole("button", { name: "更多菜单" });
}
export function getVisibleCommentMenu(page: Page) {
  return page.locator(".e2e-comment-more-operation:visible");
}
export async function closeCommentMenu(page: Page) {
  await page.keyboard.press("Escape");
  await expect(getVisibleCommentMenu(page)).toHaveCount(0);
}
