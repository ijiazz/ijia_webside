import { test as viTest } from "vitest";
import { dbPool } from "@/db/client.ts";
import { createInitIjiaDb } from "@ijia/school-db/testlib";
import process from "node:process";
import { PgDbQueryPool, DbManage } from "@asla/pg";
import { DB_CONNECT_INFO, PUBLIC_CONNECT_INFO } from "#test/utils/db.ts";

export interface DbContext {
  /** 初始化一个空的数据库（初始表和初始数据） */
  ijiaDbPool: PgDbQueryPool;
  /** 初始化一个空的数据库（初始表和初始数据），需要注意，不同测试之间会共享同一个实例和数据库, 以优化测试速度，如果需要一个全新的数据库，请使用 ijiaDbPool */
  publicDbPool: PgDbQueryPool;
}
const VITEST_WORKER_ID = +process.env.VITEST_WORKER_ID!;
const DB_NAME_PREFIX = "test_ijia_";

export const test = viTest.extend<DbContext>({
  async ijiaDbPool({}, use) {
    const dbName = DB_NAME_PREFIX + VITEST_WORKER_ID;
    await createInitIjiaDb(DB_CONNECT_INFO, dbName, { dropIfExists: true });
    dbPool.connectOption = { ...DB_CONNECT_INFO, database: dbName };
    dbPool.open();
    await use(dbPool);
    await clearDropDb(dbPool, dbName);
  },
  async publicDbPool({}, use) {
    dbPool.connectOption = PUBLIC_CONNECT_INFO;
    dbPool.open();
    await use(dbPool);
    await dbPool.close();
  },
});

async function clearDropDb(pool: PgDbQueryPool, dbName: string) {
  await pool.close(true);
  const useCount = pool.totalCount - pool.idleCount;
  try {
    const manage = await getManage();
    await manage.dropDb(dbName);
    await manage.close();
  } catch (error) {
    console.error(`清理用于测试的数据库 ${dbName} 失败`, error);
  }
  if (useCount !== 0) throw new Error("存在未释放的数据库连接");
}

function getManage() {
  return DbManage.connect(DB_CONNECT_INFO);
}
