import { resolve } from "node:path/posix";
import { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { ENV } from "@/config/mod.ts";
import { HTTPException } from "hono/http-exception";

const pkgRoot = new URL(import.meta.url);
pkgRoot.pathname = resolve(pkgRoot.pathname, "../../../..");
const baseDir = pkgRoot.toString();

export function errorHandler(error: unknown, ctx: Context): Response | Promise<Response> {
  if (error instanceof HTTPException) {
    return error.getResponse();
  } else {
    let html: string;
    let status = 500;
    if (ENV.IS_DEV) console.error(error);
    if (error instanceof Error) {
      const stackInfo: StackOption | undefined = ENV.IS_DEV ? { info: error.stack, baseDir: baseDir } : undefined;
      html = createErrorHtmlText(error, stackInfo);
    } else {
      html = String(error);
    }
    return ctx.html(html, status as ContentfulStatusCode);
  }
}
type StackOption = {
  info?: string;
  baseDir?: string;
};
function createErrorHtmlText(error: any, stack?: StackOption) {
  if (error instanceof Error) {
    let text = `<h3>${error.name}</h3>`;

    let detail: string;
    if (stack && stack.info) {
      let stackInfo = stack.info;
      if (stack.baseDir) stackInfo = stackInfo.replaceAll(stack.baseDir, "");
      detail = stackInfo;
    } else detail = error.message;
    text += `<span style="white-space:pre-wrap; font-size:12px">${detail}</span>`;

    if (error.cause) {
      text += "\n" + createErrorHtmlText(error.cause);
    }
    return text;
  } else {
    return String(error);
  }
}
