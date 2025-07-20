import { test as viTest, afterAll, vi } from "vitest";
import { DbPool, parserDbUrl, dbPool } from "@ijia/data/yoursql";
import { createInitIjiaDb, DbManage } from "@ijia/data/testlib";
import process from "node:process";
import { redisPool, RedisPool } from "@ijia/data/cache";
import { RedisFlushModes } from "@redis/client";

export interface DbContext {
  /** 初始化一个空的数据库（初始表和初始数据） */
  ijiaDbPool: DbPool;
  /** 初始化一个空的数据库（初始表和初始数据），需要注意，不同测试之间会共享同一个实例和数据库, 以优化测试速度，如果需要一个全新的数据库，请使用 ijiaDbPool */
  publicDbPool: DbPool;
  emptyDbPool: DbPool;
  redis: RedisPool;
}
const VITEST_WORKER_ID = +process.env.VITEST_WORKER_ID!;
const DB_NAME_PREFIX = "test_ijia_";
const DB_CONNECT_INFO = getConfigEnv(process.env);
const TEST_REDIS_RUL = process.env.TEST_REDIS_RUL!;

const pubDbName = DB_NAME_PREFIX + "pub_" + VITEST_WORKER_ID;
let publicDbPool: DbPool | Promise<DbPool> | undefined;

afterAll(async function () {
  if (publicDbPool) {
    const pool = await publicDbPool;
    await clearDropDb(pool, pubDbName);
  }
});

export const test = viTest.extend<DbContext>({
  async ijiaDbPool({}, use) {
    const dbName = DB_NAME_PREFIX + VITEST_WORKER_ID;
    await createInitIjiaDb(DB_CONNECT_INFO, dbName, { dropIfExists: true, extra: true });
    dbPool.connectOption = { ...DB_CONNECT_INFO, database: dbName };
    dbPool.open();
    await use(dbPool);
    await clearDropDb(dbPool, dbName);
  },
  async publicDbPool({}, use) {
    if (!publicDbPool) {
      publicDbPool = (async () => {
        await createInitIjiaDb(DB_CONNECT_INFO, pubDbName, { dropIfExists: true, extra: true });
        dbPool.connectOption = { ...DB_CONNECT_INFO, database: pubDbName };
        dbPool.open();
        publicDbPool = dbPool;
        return dbPool;
      })();
    }
    const pool = await publicDbPool;
    await use(pool);
  },
  async emptyDbPool({}, use) {
    const dbName = "test_empty_" + VITEST_WORKER_ID;

    const manage = await getManage();
    await manage.recreateDb(dbName);
    await manage.close();
    dbPool.connectOption = { ...DB_CONNECT_INFO, database: dbName };
    dbPool.open();
    await use(dbPool);
    await clearDropDb(dbPool, dbName);
  },
  async redis({}, use) {
    const url = new URL(TEST_REDIS_RUL);
    url.pathname = VITEST_WORKER_ID.toString();
    redisPool.url = url;
    const conn = await redisPool.connect();
    await conn.flushDb(RedisFlushModes.SYNC);
    conn.release();
    use(redisPool);
    const used = redisPool.totalCount - redisPool.idleCount;
    await redisPool.close(true);
    if (used !== 0) {
      throw new Error("存在未释放的 Redis 连接");
    }
  },
});
function getConfigEnv(env: Record<string, string | undefined>) {
  const url = env["TEST_LOGIN_DB"];
  if (!url) throw new Error("缺少 TEST_LOGIN_DB 环境变量");
  return parserDbUrl(url);
}
async function clearDropDb(pool: DbPool, dbName: string) {
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
