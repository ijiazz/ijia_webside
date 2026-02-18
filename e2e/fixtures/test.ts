import { Page, test } from "@playwright/test";
import process from "node:process";
import { dbPool } from "@/db/client.ts";
import { env } from "@/playwright.config.ts";
import { DbQueryPool } from "@asla/pg";

export interface Context {
  dbPool: DbQueryPool;
  appPage: Page;
  webInfo: typeof env;
}
const PROCESS_PORT_NUMBER = 10;
const VIO_SERVER_BASE_PORT = 7001;
if (!process.env.DATABASE_URL) dbPool.connectOption = env.DATABASE_URL;

export const vioServerTest = test.extend<Context>({
  async dbPool({}, use) {
    await use(dbPool);
    await dbPool.close(true);
  },
  async appPage({}, use) {},
  webInfo({}, use) {
    return use(env);
  },
});
/** @deprecated 改用 getAppURLFromRoute */
export function getAppUrlFromRoute(route: string, token?: string): string {
  if (!route.startsWith("/")) throw new Error("router must start with /");
  const base = new URL(env.WEB_URL + route);
  if (token) {
    base.searchParams.append("access_token", token);
  }
  return base.toString();
}
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
function getFreePort() {
  const processIndex = parseInt(process.env.TEST_PARALLEL_INDEX!);
  let processPortBase = VIO_SERVER_BASE_PORT + processIndex * PROCESS_PORT_NUMBER;
  return processPortBase;
}
