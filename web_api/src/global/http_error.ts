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
    const html = createErrorHtmlText(error, { baseDir: baseDir, showStack: !ENV.IS_PROD });
    return ctx.html(html, status as ContentfulStatusCode);
  }
}
type StackOption = {
  showStack?: boolean;
  baseDir?: string;
};
function createErrorHtmlText(error: any, stackOption: StackOption = {}) {
  if (error instanceof Error) {
    let text = `<h3>${error.message}</h3>\n`;

    let stack = error.stack;
    let detail: string;
    if (stack && stackOption.showStack) {
      if (stackOption.baseDir) stack = stack.replaceAll(stackOption.baseDir, "");
      detail = stack;
    } else detail = `${error.name}: ${error.message}`;
    text += `<span style="white-space:pre-wrap; font-size:12px">${detail}</span>\n`;

    if (error.cause) {
      text += "\n" + createErrorHtmlText(error.cause, stackOption);
    }
    return text;
  } else {
    return String(error);
  }
}
