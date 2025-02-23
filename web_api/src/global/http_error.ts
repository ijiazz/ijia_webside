import { resolve } from "node:path/posix";
import { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { ENV } from "@/config/mod.ts";
import { toErrorStr } from "evlib";

const pkgRoot = new URL(import.meta.url);
pkgRoot.pathname = resolve(pkgRoot.pathname, "../../../..");
const baseDir = pkgRoot.toString();

function errorProd(error: unknown, ctx: Context) {
  let html: string;
  let status = 500;
  if (error instanceof Error) {
    html = createErrorHtmlText(error, ENV.IS_DEV ? { info: error.stack, baseDir: baseDir } : undefined);
  } else {
    html = String(error);
  }
  return ctx.html(html, status as ContentfulStatusCode);
}
function errorTest(error: unknown, ctx: Context) {
  console.log(error)
  return ctx.text(toErrorStr(error, true), 500);
}

export const errorHandler = ENV.IS_DEV ? errorTest : errorProd;

function createErrorHtmlText(error: Error, stack?: { info?: string; baseDir?: string }) {
  let text = `<h3>${error.name}</h3></br>`;

  let detail: string;
  if (stack && stack.info) {
    let stackInfo = stack.info;
    if (stack.baseDir) stackInfo = stackInfo.replaceAll(stack.baseDir, "");
    detail = stackInfo;
  } else detail = error.message;
  text += `<span style="white-space:pre-wrap; font-size:12px">${detail}</span>`;
  return text;
}
