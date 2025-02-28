import { Hono } from "hono";
import { addServeStatic } from "../hono/serve_static.ts";
import { applyController } from "@asla/hono-decorator";
import { controllers } from "./mod.ts";
import { errorHandler } from "../global/http_error.ts";

export function createHonoApp(option: { static?: boolean } = {}) {
  const hono = createHono(option);
  for (const controller of controllers) {
    applyController(hono, controller);
  }
  return hono;
}

export function createHono(option: { static?: boolean } = {}) {
  const hono = new Hono();
  hono.onError(errorHandler);
  if (option.static) addServeStatic(hono);
  return hono;
}
