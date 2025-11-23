import { Hono } from "hono";
import { addServeStatic } from "../hono/serve_static.ts";
import { applyController, ApplyControllerOption } from "@asla/hono-decorator";
import { errorHandler } from "../global/http_error.ts";

import { userController } from "./user/mod.ts";
import { passportController } from "./passport/mod.ts";
import accountController from "./passport/account.controller.ts";
import { classController } from "./class/mod.ts";
import { imageCaptchaController } from "./captcha/mod.ts";
import {
  postController,
  platformPostController,
  postGroupController,
  commentController,
  postReviewController,
} from "./post/mod.ts";
import { liveController } from "./live/live.controller.ts";
import { appController } from "./app/app.controller.ts";

export function createHonoApp() {
  const hono = createHono({ static: true });
  const options: ApplyControllerOption = { basePath: "/api" };
  applyController(hono, passportController, options);
  applyController(hono, accountController, options);

  applyController(hono, imageCaptchaController, options);
  applyController(hono, userController, options);
  applyController(hono, classController, options);

  applyController(hono, platformPostController, options);
  applyController(hono, postGroupController, options);
  applyController(hono, postController, options);
  applyController(hono, commentController, options);
  applyController(hono, postReviewController, options);

  applyController(hono, liveController, options);
  applyController(hono, appController, options);
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
