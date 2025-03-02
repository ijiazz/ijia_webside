import { Page, test } from "@playwright/test";
import process from "node:process";
import { createPgPool, setDbPool, DbPool } from "@ijia/data/yoursql";
import { env } from "@/playwright.config.ts";

export interface Context {
  dbPool: DbPool;
  appPage: Page;
  webUrl: string;
}
const PROCESS_PORT_NUMBER = 10;
const VIO_SERVER_BASE_PORT = 7001;

export const vioServerTest = test.extend<Context>({
  async dbPool({}, use) {
    const pool = createPgPool(env.pg_url);
    setDbPool(pool);
    await use(pool);
    await pool.close(true);
  },
  async appPage({}, use) {},
  webUrl({}, use) {
    return use(env.web_url);
  },
});

function getFreePort() {
  const processIndex = parseInt(process.env.TEST_PARALLEL_INDEX!);
  let processPortBase = VIO_SERVER_BASE_PORT + processIndex * PROCESS_PORT_NUMBER;
  return processPortBase;
}
