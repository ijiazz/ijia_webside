import "@/db/client.ts";

import { createInitIjiaDb } from "@ijia/school-db/testlib";
import { DB_CONNECT_INFO, PUBLIC_CONNECT_INFO, PUBLIC_DB_NAME } from "#test/utils/db.ts";
import { DbManage } from "@asla/pg";
import { preparePassedQuestions } from "./examation.ts";
import { dbPool } from "@/db/client.ts";

export async function initPublicDB() {
  await using conn = await DbManage.connect(DB_CONNECT_INFO);
  const client = conn.dbClient;
  const [info] = await client.queryRows<{ connections: number }>(`
    SELECT count(*)::INT AS connections
    FROM pg_stat_activity WHERE datname = '${PUBLIC_DB_NAME}'`);
  if (info.connections) {
    console.log("跳过初始化公共数据库");
    return;
  }
  console.log("初始化公共数据库");
  await createInitIjiaDb(DB_CONNECT_INFO, PUBLIC_DB_NAME, { dropIfExists: true, test: true });

  dbPool.connectOption = PUBLIC_CONNECT_INFO;
  dbPool.open();
  await preparePassedQuestions(10);
}
