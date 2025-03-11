import { Page, test, Response } from "@playwright/test";
import process from "node:process";
import { dbPool, DbPool } from "@ijia/data/yoursql";
import { env } from "@/playwright.config.ts";

export interface Context {
  dbPool: DbPool;
  appPage: Page;
  webInfo: typeof env;
  getAppUrlByRouter(router: string): string;
}
const PROCESS_PORT_NUMBER = 10;
const VIO_SERVER_BASE_PORT = 7001;

export const vioServerTest = test.extend<Context>({
  async dbPool({}, use) {
    dbPool.connectOption = env.pgUrl;
    await use(dbPool);
    await dbPool.close(true);
  },
  async appPage({}, use) {},
  webInfo({}, use) {
    return use(env);
  },
  getAppUrlByRouter({ webInfo }, use) {
    return use((router) => webInfo.webUrl + "/x/#" + router);
  },
});

function getFreePort() {
  const processIndex = parseInt(process.env.TEST_PARALLEL_INDEX!);
  let processPortBase = VIO_SERVER_BASE_PORT + processIndex * PROCESS_PORT_NUMBER;
  return processPortBase;
}
