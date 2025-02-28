import { ToResponse } from "@/hono-decorator/src/base.ts";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";

export function toJson(value: object, ctx: Context) {
  return ctx.json(value);
}
/** 自动根据返回值推断响应的 content-type */
export const autoBody = ToResponse(function (result, ctx): Response {
  switch (typeof result) {
    case "string":
      return ctx.text(result);
    case "object": {
      if (result === null) return ctx.body(null);
      if (result instanceof Response) return result;
      else if (result instanceof ReadableStream || result instanceof Uint8Array) return ctx.body(result);

      return ctx.json(result);
    }
    default:
      throw new HTTPException(500, { message: "无效的 Body" });
  }
});
