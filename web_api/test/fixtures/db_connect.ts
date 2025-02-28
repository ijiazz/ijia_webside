import { test as viTest } from "vitest";
import { createPgClient, createPgPool, DbConnectOption, DbPool, parserDbUrl, setDbPool } from "@ijia/data/yoursql";
import { DbManage } from "@ijia/data/testlib";
import process from "node:process";
import { RedisClient, setRedis } from "@/redis/mod.ts";
import { createClient, RedisFlushModes } from "@redis/client";

export interface DbContext {
  /** 初始化一个空的数据库（初始表和初始数据） */
  ijiaDbPool: DbPool;
  emptyDbPool: DbPool;
  redis: RedisClient;
}
const VITEST_WORKER_ID = +process.env.VITEST_WORKER_ID!;
const IJIA_TEMPLATE_DBNAME = process.env.IJIA_TEMPLATE_DBNAME!; // global setup 创建

const TEST_REDIS_RUL = process.env.TEST_LOGIN_REDIS!; // global setup 创建

const templateDbInfo: DbConnectOption = parserDbUrl(process.env["TEST_LOGIN_DB"]!);
export const test = viTest.extend<DbContext>({
  async ijiaDbPool({}, use) {
    const dbName = IJIA_TEMPLATE_DBNAME + "_" + VITEST_WORKER_ID;
    await using manage = new DbManage(await createPgClient(templateDbInfo));

    await manage.copy(IJIA_TEMPLATE_DBNAME, dbName);
    const connectOption: DbConnectOption = { ...templateDbInfo, database: dbName };

    const dbPool = await createPgPool(connectOption);
    setDbPool(dbPool);
    await use(dbPool);
    await dbPool.close(true);

    await manage.dropDb(dbName);
  },
  async emptyDbPool({}, use) {
    const dbName = "test_empty_" + VITEST_WORKER_ID;

    await using manage = new DbManage(await createPgClient(templateDbInfo));

    await manage.dropDb(dbName);
    await manage.createDb(dbName);
    const client = await createPgPool({ ...templateDbInfo, database: dbName });
    await use(client);
    await client.close();

    await manage.dropDb(dbName);
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
