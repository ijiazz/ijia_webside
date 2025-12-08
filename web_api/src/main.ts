import { ENV, appConfig, constWatcher } from "@/config.ts";
import { createHonoApp } from "./bootstrap/hono_app.ts";
import { dbPool } from "@/db/client.ts";
import { listenHttpServer, ListenOption } from "@/bootstrap/listen.ts";
import { redisPool } from "@/services/redis.ts";
import { watchIjia } from "@/services/waitch_live/user_live.service.ts";

async function bootstrap() {
  console.log(`Server listen: ${ENV.LISTEN_ADDR}:${ENV.LISTEN_PORT}`);
  console.log(`Mode: ${ENV.MODE}`);

  const hono = createHonoApp();
  const listenOption: ListenOption = {
    hostname: ENV.LISTEN_ADDR,
    port: ENV.LISTEN_PORT,
  };

  const server = await listenHttpServer(hono, listenOption);
  console.log("Server ready");
  if (appConfig.live_watch.pollingMinute >= 1 && ENV.CHECK_SERVER) watchIjia.start();
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
