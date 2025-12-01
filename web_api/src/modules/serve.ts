import { Hono } from "hono";
import { addServeStatic } from "../hono/serve_static.ts";
import { applyController, ApplyControllerOption } from "@asla/hono-decorator";
import { errorHandler } from "../global/http_error.ts";

import { passportController } from "./passport/mod.ts";
import accountController from "./passport/account.controller.ts";
import { imageCaptchaController } from "../routers/captcha/mod.ts";
import liveRoutes from "../routers/live/mod.ts";

import { commentRoutes, postRoutes, appRoutes, captchaRoutes, classRoutes } from "@/routers/mod.ts";
import userRoutes from "@/routers/user/mod.ts";

export function createHonoApp() {
  const hono = createHono({ static: true });
  const options: ApplyControllerOption = { basePath: "/api" };
  applyController(hono, passportController, options);
  applyController(hono, accountController, options);

  applyController(hono, imageCaptchaController, options);

  postRoutes.apply(hono, options);
  commentRoutes.apply(hono, options);
  appRoutes.apply(hono, options);
  captchaRoutes.apply(hono, options);
  classRoutes.apply(hono, options);
  userRoutes.apply(hono, options);
  liveRoutes.apply(hono, options);

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
  return hono;
}
