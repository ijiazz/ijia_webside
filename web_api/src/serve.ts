import { createHonoAdapter } from "@/hono/HonoAdapter.ts";
import { HonoAdapter, NestHonoApplication } from "nest-hono-adapter";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./modules/app.module.ts";
import { HttpExceptionFilter } from "./global/exception.filter.ts";
import { ENV } from "./config/mod.ts";
import { Hono } from "hono";
import { addServeStatic } from "./hono/serve_static.ts";

export async function listenNestApp(
  option: { port?: number; hostname?: string; static?: boolean; fakeServer?: boolean } = {},
) {
  const { fakeServer, hostname = "127.0.0.1", port = 3000 } = option;
  const honoAdapter: HonoAdapter = fakeServer ? new HonoAdapter() : createHonoAdapter();
  const app = await NestFactory.create<NestHonoApplication>(AppModule, honoAdapter, {});
  if (ENV.IS_DEV) {
    app.useGlobalFilters(new HttpExceptionFilter());
  }
  const hono: Hono = honoAdapter.getInstance();
  if (option.static) addServeStatic(hono);
  //   if (config.LOGS_DIR) app.useGlobalInterceptors(new LoggerInterceptor());
  await app.listen(port, hostname);
  return { app, hono };
}
