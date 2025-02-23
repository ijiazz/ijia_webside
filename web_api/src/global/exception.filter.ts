import { resolve } from "node:path/posix";
import { Context } from "hono";

const pkgRoot = new URL(import.meta.url);
pkgRoot.pathname = resolve(pkgRoot.pathname, "../../../..");
const baseDir = pkgRoot.toString();

export async function errorHandler(error: unknown, ctx: Context) {
  let html: string;
  if (error instanceof Error) {
    html = createErrorText(error, { info: error.stack, baseDir: baseDir });
  } else {
    html = String(error);
  }
  return ctx.html(html, 500);
}

function createErrorText(error: Error, stack?: { info?: string; baseDir?: string }) {
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
