import { Page, test } from "@playwright/test";
import process from "node:process";
import { dbPool, DbPool } from "@ijia/data/yoursql";
import { env } from "@/playwright.config.ts";

export interface Context {
  dbPool: DbPool;
  appPage: Page;
  webInfo: typeof env;
}
const PROCESS_PORT_NUMBER = 10;
const VIO_SERVER_BASE_PORT = 7001;
if (!process.env.DATABASE_URL) dbPool.connectOption = env.pgUrl;

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

export function getAppUrlByRouter(router: string, token?: string): string {
  const base = new URL(env.webUrl + "/x/");
  if (token) {
    base.searchParams.append("access_token", token);
  }
  base.hash = router;
  return base.toString();
}
function getFreePort() {
  const processIndex = parseInt(process.env.TEST_PARALLEL_INDEX!);
  let processPortBase = VIO_SERVER_BASE_PORT + processIndex * PROCESS_PORT_NUMBER;
  return processPortBase;
}
