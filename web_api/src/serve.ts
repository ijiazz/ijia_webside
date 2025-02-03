import { createHonoAdapter } from "@/hono/HonoAdapter.ts";
import { HonoAdapter, NestHonoApplication } from "nest-hono-adapter";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./modules/app.module.ts";
import { HttpExceptionFilter } from "./global/exception.filter.ts";
import { ENV } from "./config/mod.ts";
import { Hono } from "hono";
import { addServeStatic } from "./hono/serve_static.ts";
import { RolesMiddleware } from "./global/auth.ts";

const honoAdapter: HonoAdapter = createHonoAdapter();

export const hono: Hono = honoAdapter.getInstance();

export async function setup() {
  const app = await NestFactory.create<NestHonoApplication>(AppModule, honoAdapter, {});
  // app.use(RolesMiddleware);
  // app.useStaticAssets;
  if (ENV.IS_DEV) {
    app.useGlobalFilters(new HttpExceptionFilter());
  }

  addServeStatic(hono);
  //   if (config.LOGS_DIR) app.useGlobalInterceptors(new LoggerInterceptor());
  return app;
}
