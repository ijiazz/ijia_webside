import { Hono } from "hono";
import { addServeStatic } from "../hono/serve_static.ts";
import { applyController } from "@asla/hono-decorator";
import { errorHandler } from "../global/http_error.ts";

import { userController } from "./user/mod.ts";
import { passportController } from "./passport/mod.ts";
import { classController } from "./class/mod.ts";
import { imageCaptchaController } from "./captcha/mod.ts";

export function createHonoApp(option: { static?: boolean } = {}) {
  const hono = createHono(option);
  applyController(hono, passportController);
  applyController(hono, imageCaptchaController);
  applyController(hono, userController);
  applyController(hono, classController);
  return hono;
}

export function createHono(option: { static?: boolean } = {}) {
  const hono = new Hono();
  hono.onError(errorHandler);
  if (option.static) addServeStatic(hono);
  return hono;
}
