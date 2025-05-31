import { Hono } from "hono";
import { addServeStatic } from "../hono/serve_static.ts";
import { applyController } from "@asla/hono-decorator";
import { errorHandler } from "../global/http_error.ts";

import { userController } from "./user/mod.ts";
import { passportController } from "./passport/mod.ts";
import accountController from "./passport/account.controller.ts";
import { classController } from "./class/mod.ts";
import { imageCaptchaController } from "./captcha/mod.ts";
import { postController, platformPostController, postGroupController } from "./post/mod.ts";
import { liveController } from "./live/live.controller.ts";
import { appController } from "./app/app.controller.ts";

export function createHonoApp(option: { static?: boolean } = {}) {
  const hono = createHono(option);
  applyController(hono, passportController);
  applyController(hono, accountController);

  applyController(hono, imageCaptchaController);
  applyController(hono, userController);
  applyController(hono, classController);
  applyController(hono, platformPostController);
  applyController(hono, postGroupController);
  applyController(hono, postController);
  applyController(hono, liveController);
  applyController(hono, appController);
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
