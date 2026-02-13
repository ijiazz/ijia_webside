import { Hono } from "hono";
import { addServeStatic } from "./serve_static.ts";
import { RouteApplyOption } from "@/lib/route.ts";
import { errorHandler } from "./_error_handler.ts";

import {
  commentRoutes,
  postRoutes,
  appRoutes,
  captchaRoutes,
  classRoutes,
  userRoutes,
  passportRoutes,
  liveRoutes,
  reviewRoutes,
} from "@/routers/mod.ts";

import { setUserInfo } from "@/middleware/auth.ts";

export function createHonoApp() {
  const hono = createHono({ static: true });
  const options: RouteApplyOption = { basePath: "/api" };

  postRoutes.apply(hono, options);
  commentRoutes.apply(hono, options);
  appRoutes.apply(hono, options);
  captchaRoutes.apply(hono, options);
  classRoutes.apply(hono, options);
  userRoutes.apply(hono, options);
  liveRoutes.apply(hono, options);
  passportRoutes.apply(hono, options);
  reviewRoutes.apply(hono, options);
  return hono;
}

export function createHono(option: { static?: boolean } = {}) {
  const hono = new Hono();
  hono.onError(errorHandler);
  if (option.static) addServeStatic(hono);
  hono.use(function (ctx, next) {
    ctx.header("Server", "Hono");
    return next();
  });
  hono.use(setUserInfo);
  return hono;
}
