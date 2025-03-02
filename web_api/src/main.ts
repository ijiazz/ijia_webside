import { ENV } from "@/config/mod.ts";
import { createHonoApp } from "./modules/serve.ts";
import { getDbPool, setDbPool, createPgPool, DbPool } from "@ijia/data/yoursql";
import { listenUseDenoHttpServer, listenUseNodeHttpServer, ListenOption, AppServer } from "@/hono/listen.ts";
import { disconnectRedis, getRedis } from "./redis/mod.ts";
import { toErrorStr } from "evlib";

async function testDatabase() {
  let pool: DbPool;
  try {
    pool = getDbPool();
  } catch (error) {
    console.warn("未设置 DATABASE_URL 环境变量, 将使用默认数据库地址");
    pool = createPgPool({ database: "ijia" });
    setDbPool(pool);
  }
  try {
    const conn = await pool.connect();
    conn.release();
  } catch (error) {
    console.error("数据库连接失败", toErrorStr(error));
  }
}
async function bootstrap() {
  console.log("正测试数据库连接");
  await testDatabase();
  console.log(`Server listen: ${ENV.LISTEN_ADDR}:${ENV.LISTEN_PORT}`);

  const hono = createHonoApp({});
  const listenOption: ListenOption = {
    hostname: ENV.LISTEN_ADDR,
    port: ENV.LISTEN_PORT,
  };

  let server: AppServer;
  //@ts-ignore
  if (globalThis.Deno) {
    server = await listenUseDenoHttpServer(hono, listenOption);
  } else {
    server = await listenUseNodeHttpServer(hono, listenOption);
  }
  console.log("Server ready");

  let isClosed = false;
  function exit() {
    if (isClosed) {
      process.exit(0);
    }
    isClosed = true;
    return Promise.all([
      getDbPool()
        .close()
        .then(() => {
          console.log("数据连接已关闭");
        }),
      disconnectRedis().then(() => {
        console.log("Redis 连接已关闭");
      }),
      ,
      server.close().then(() => {
        console.log("API 服务已关闭");
      }),
    ]);
  }
  if (process.platform === "win32") process.on("SIGBREAK", exit);
  else process.on("SIGTERM", exit);
  process.on("SIGINT", exit);
}
await bootstrap();
