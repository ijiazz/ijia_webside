import { ENV, constWatcher, RunMode } from "@/config.ts";
import { createHonoApp } from "./modules/serve.ts";
import { dbPool } from "@ijia/data/yoursql";
import { listenUseDenoHttpServer, listenUseNodeHttpServer, ListenOption, AppServer } from "@/hono/listen.ts";
import { redisPool } from "@ijia/data/cache";

async function bootstrap() {
  console.log(`Server listen: ${ENV.LISTEN_ADDR}:${ENV.LISTEN_PORT}`);
  console.log(`Mode: ${ENV.MODE}`);

  const hono = createHonoApp({ static: ENV.MODE === RunMode.Dev });
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
      dbPool.close().then(() => {
        console.log("数据连接已关闭");
      }),
      redisPool.close().then(() => {
        console.log("Redis 连接已关闭");
      }),
      server.close().then(() => {
        console.log("API 服务已关闭");
      }),
      constWatcher.close(),
    ]);
  }
  if (process.platform === "win32") process.on("SIGBREAK", exit);
  else process.on("SIGTERM", exit);
  process.on("SIGINT", exit);
}
await bootstrap();
