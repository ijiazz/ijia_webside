import { ENV } from "@/config/mod.ts";
import { setup } from "./serve.ts";
import { getDbPool, setDbPool, createPgPool, DbPool } from "@ijia/data/yoursql";

async function testDatabase() {
  let pool: DbPool;
  try {
    pool = getDbPool();
  } catch (error) {
    console.warn("未设置 DbPool, 将使用默认数据库地址");
    pool = createPgPool({ database: "ijia" });
    setDbPool(pool);
  }
  try {
    const conn = await pool.connect();
    conn.release();
  } catch (error) {
    console.error("数据库连接失败", error);
  }
}
async function bootstrap() {
  const app = await setup();
  console.log("正测试数据库连接");
  await testDatabase();
  console.log(`Server listen: ${ENV.LISTEN_ADDR}:${ENV.LISTEN_PORT}`);
  await app.listen(ENV.LISTEN_PORT, ENV.LISTEN_ADDR);
  console.log("Server ready");
}
await bootstrap();
