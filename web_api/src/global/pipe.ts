import { Context } from "hono";

export function toJson(value: object, ctx: Context) {
  return ctx.json(value);
}
