import type { Page, Response } from "@playwright/test";

export type ResponseMatcher = string | RegExp | ((response: Response) => boolean);

function matchesResponse(response: Response, matcher: ResponseMatcher): boolean {
  if (typeof matcher === "function") return matcher(response);
  if (typeof matcher === "string") return response.url().includes(matcher);

  matcher.lastIndex = 0;
  return matcher.test(response.url());
}
export async function runAfterResponse<T>(option: {
  page: Page;
  action: () => T;
  matcher: ResponseMatcher;
}): Promise<{ response: Response; result: T }> {
  const { action, matcher, page } = option;
  const responsePromise = page.waitForResponse((item) => matchesResponse(item, matcher));
  const result = await action();
  const response = await responsePromise;
  return { response, result };
}
