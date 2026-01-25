import { resolve } from "node:path/posix";
import { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { ENV } from "@/config.ts";
import { HTTPException } from "hono/http-exception";

const pkgRoot = new URL(import.meta.url);
pkgRoot.pathname = resolve(pkgRoot.pathname, "../../../..");
const baseDir = pkgRoot.toString();

export function errorHandler(error: unknown, ctx: Context): Response | Promise<Response> {
  if (error instanceof HTTPException) {
    return error.getResponse();
  } else {
    console.error(error);
    let status = 500;
    const html = createErrorJson(error, { baseDir: baseDir, showStack: !ENV.IS_PROD });
    return ctx.json(html, status as ContentfulStatusCode);
  }
}
type StackOption = {
  showStack?: boolean;
  baseDir?: string;
};
function createErrorJson(error: any, stackOption: StackOption = {}): ErrorJson {
  if (error instanceof Error) {
    let stack = error.stack;
    if (stack && stackOption.showStack) {
      if (stackOption.baseDir) stack = stack.replaceAll(stackOption.baseDir, "");
    }

    return {
      message: error.message,
      stack: stack,
      cause: error.cause ? createErrorJson(error.cause, stackOption) : undefined,
    };
  } else {
    return {
      message: String(error),
    };
  }
}
type ErrorJson = {
  message: string;
  stack?: string;
  cause?: ErrorJson;
};
