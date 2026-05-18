import { env } from "@/playwright.config.ts";

export function getAppURLFromRoute(
  route: string,
  search?: { [key: string]: string | number | boolean | undefined },
): string {
  if (!route.startsWith("/")) throw new Error("router must start with /");
  const url = new URL(env.WEB_URL + route);
  if (search) {
    for (const [key, value] of Object.entries(search)) {
      if (value !== undefined) {
        url.searchParams.append(key, String(value));
      }
    }
  }
  return url.toString();
}
