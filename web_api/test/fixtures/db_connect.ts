import { test as viTest } from "vitest";
import { createPgClient, createPgPool, DbConnectOption, DbPool, parserDbUrl, setDbPool } from "@ijia/data/yoursql";
import { DbManage } from "@ijia/data/testlib";
import process from "node:process";
export interface BaseContext {
  /** 初始化一个空的数据库（初始表和初始数据） */
  ijiaDbPool: DbPool;
  emptyDbPool: DbPool;
}
const VITEST_WORKER_ID = +process.env.VITEST_WORKER_ID!;
const IJIA_TEMPLATE_DBNAME = process.env.IJIA_TEMPLATE_DBNAME!; // global setup 创建
const templateDbInfo: DbConnectOption = parserDbUrl(process.env["TEST_LOGIN_DB"]!);
export const test = viTest.extend<BaseContext>({
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
});
