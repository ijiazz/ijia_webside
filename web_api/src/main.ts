import { ENV } from "@/config/mod.ts";
import { listenNestApp } from "./serve.ts";
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
  console.log("正测试数据库连接");
  await testDatabase();
  console.log(`Server listen: ${ENV.LISTEN_ADDR}:${ENV.LISTEN_PORT}`);
  await listenNestApp({ hostname: ENV.LISTEN_ADDR, port: ENV.LISTEN_PORT });
  console.log("Server ready");
}
await bootstrap();
