import { ENV } from "../config/mod.ts";
import { Hono } from "hono";
import { addServeStatic } from "../hono/serve_static.ts";
import { applyController } from "@asla/hono-decorator";
import { controllers } from "./mod.ts";
import { errorHandler } from "../global/http_error.ts";

export function createHonoApp(option: { static?: boolean } = {}) {
  const hono = new Hono();
  hono.onError(errorHandler);
  if (option.static) addServeStatic(hono);
  for (const Controller of controllers) {
    console.log(Controller.name);
    applyController(hono, new Controller());
  }
  return hono;
}
