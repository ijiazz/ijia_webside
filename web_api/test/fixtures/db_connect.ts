import { test as viTest } from "vitest";
import { createPgPool, DbPool, parserDbUrl, setDbPool } from "@ijia/data/yoursql";
import { createInitIjiaDb, DbManage } from "@ijia/data/testlib";
import process from "node:process";
import { RedisClient, setRedis } from "@/services/redis.ts";
import { createClient, RedisFlushModes } from "@redis/client";

export interface DbContext {
  /** 初始化一个空的数据库（初始表和初始数据） */
  ijiaDbPool: DbPool;
  emptyDbPool: DbPool;
  redis: RedisClient;
}
const VITEST_WORKER_ID = +process.env.VITEST_WORKER_ID!;
const DB_NAME_PREFIX = "test_ijia_";
const DB_CONNECT_INFO = getConfigEnv(process.env);
const TEST_REDIS_RUL = process.env.TEST_REDIS_RUL!;

export const test = viTest.extend<DbContext>({
  async ijiaDbPool({}, use) {
    const dbName = DB_NAME_PREFIX + VITEST_WORKER_ID;
    await createInitIjiaDb(DB_CONNECT_INFO, dbName, { dropIfExists: true, extra: true });
    const dbPool = await createPgPool({ ...DB_CONNECT_INFO, database: dbName });
    setDbPool(dbPool);
    await use(dbPool);
    await dbPool.close(true);

    await clearDropDb(dbName);
  },
  async emptyDbPool({}, use) {
    const dbName = "test_empty_" + VITEST_WORKER_ID;

    const manage = await getManage();
    await manage.emptyDatabase(dbName);
    await manage.close();

    const dbPool = await createPgPool({ ...DB_CONNECT_INFO, database: dbName });
    await use(dbPool);
    await dbPool.close();

    await clearDropDb(dbName);
  },
  async redis({}, use) {
    const client = createClient({ url: TEST_REDIS_RUL, database: VITEST_WORKER_ID });
    await client.connect();
    await client.flushDb(RedisFlushModes.SYNC);
    setRedis(client);
    //@ts-ignore
    use(client);
  },
});
function getConfigEnv(env: Record<string, string | undefined>) {
  const url = env["TEST_LOGIN_DB"];
  if (!url) throw new Error("缺少 TEST_LOGIN_DB 环境变量");
  return parserDbUrl(url);
}
async function clearDropDb(dbName: string) {
  try {
    const manage = await getManage();
    await manage.dropDb(dbName);
    await manage.close();
  } catch (error) {
    console.error(`清理用于测试的数据库 ${dbName} 失败`, error);
  }
}

function getManage() {
  return DbManage.connect(DB_CONNECT_INFO);
}
