import { Context, MiddlewareHandler, Next } from "hono";
import { ServeStaticOptions } from "hono/serve-static";
import path from "node:path";
import { HTTPException } from "hono/http-exception";
import { createFileStream } from "@ijia/data/oss";
import fs from "node:fs/promises";
import { Stats } from "node:fs";
import { contentType } from "@std/media-types";

function isCached(mtime: Date, ctx: Context) {
  const realMtimeStr = mtime.toUTCString();
  ctx.header("Last-Modified", realMtimeStr);
  const reqMtimeStr = ctx.req.header("If-Modified-Since");
  if (reqMtimeStr) {
    return reqMtimeStr === realMtimeStr;
  }
}

function getHttpHeaderRange(range: string) {
  const rangeMatch = range.match(/bytes=(\d+)-(\d+)?/);
  if (rangeMatch) {
    const start = parseInt(rangeMatch[1]);
    const end = rangeMatch[2] ? parseInt(rangeMatch[2]) : undefined;
    return { start, end };
  }
  throw new HTTPException(416, { res: new Response("Range Not Satisfiable") });
}
export async function createRuntimeServeStatic(
  options: Pick<ServeStaticOptions, "rewriteRequestPath" | "root" | "onFound">,
): Promise<MiddlewareHandler> {
  const { rewriteRequestPath, onFound } = options;
  const rooDir = path.resolve(options.root ?? ".");

  return async function (ctx: Context, next: Next) {
    const method = ctx.req.method;
    if (method !== "HEAD" && method !== "GET") return next();

    let pathname = ctx.req.path;
    if (rewriteRequestPath) pathname = rewriteRequestPath(pathname);
    const filename = path.resolve(rooDir, pathname.slice(1));
    const stat = await statFile(filename);
    if (!stat) {
      return ctx.text("文件不存在", 404);
    }

    ctx.header("Content-Type", contentType(filename));
    ctx.header("Accept-Ranges", "bytes");

    await onFound?.(filename, ctx);
    if (method === "HEAD") return ctx.body(null, 200);
    if (await isCached(stat.mtime, ctx)) return ctx.body(null, 304);

    const range = ctx.req.header("Range");
    if (range) {
      const ifRangeStr = ctx.req.header("If-Range");
      if (!ifRangeStr || ifRangeStr === stat.mtime.toUTCString()) {
        const { end = stat.size, start } = getHttpHeaderRange(range);

        ctx.header("Content-Length", (end - start).toString());
        ctx.header("Content-Range", `bytes ${start}-${end - 1}/${stat.size}`);
        ctx.status(206);
        return ctx.body(createFileStream(filename, { start, end }));
      }
    }

    ctx.header("Content-Length", stat.size.toString());
    return ctx.body(createFileStream(filename));
  };
}
async function statFile(filename: string): Promise<Stats | null> {
  try {
    return await fs.stat(filename);
  } catch (error) {
    if (error instanceof Error && (error as any).code === "ENOENT") {
      return null;
    }
    throw error;
  }
}
