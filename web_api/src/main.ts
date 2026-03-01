import { ENV, appConfig, constWatcher } from "@/config.ts";
import { createHonoApp } from "./bootstrap/hono_app.ts";
import { dbPool } from "@/db/client.ts";
import { listenHttpServer, ListenOption } from "@/bootstrap/listen.ts";
import { redisPool } from "@/services/redis.ts";
import { watchIjia } from "@/services/waitch_live/user_live.service.ts";
import { getOSS } from "@ijia/data/oss";
import { unrefTimer } from "./lib/timer.ts";

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

  clearTempDir();

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

async function clearTempDir() {
  console.warn("每天凌晨4点清理一次临时目录");
  const nextTimeMs = (() => {
    const now = new Date();
    const next = new Date();
    next.setHours(4, 0, 0, 0);
    if (now >= next) next.setDate(next.getDate() + 1);
    return next.getTime() - now.getTime();
  })();

  if (nextTimeMs > 4 * 3600 * 1000) {
    execClear();
  }

  let timer = setTimeout(() => {
    const interval = setInterval(execClear, 86400 * 1000);
    unrefTimer(interval);
  }, nextTimeMs);
  unrefTimer(timer);
}
async function execClear() {
  const oss = getOSS();
  const now = Date.now();
  try {
    await oss.tempDir.clearOutdated();
  } catch (error) {
    console.error("清理临时目录失败", error);
  }
  const useTime = Date.now() - now;
  console.log(`清理临时目录完成，耗时 ${(useTime / 1000).toFixed(2)}s`);
}
