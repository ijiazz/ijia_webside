import { Context, MiddlewareHandler, Next } from "hono";
import { ServeStaticOptions } from "hono/serve-static";
import { Hono } from "hono";
import { ENV } from "@/config.ts";
import path from "node:path";
import { platform } from "node:os";
import { HTTPException } from "hono/http-exception";
import { UserInfo } from "@/global/auth.ts";
import { getCookie } from "hono/cookie";
import { getBucket, createFileStream } from "@ijia/data/oss";
import fs from "node:fs/promises";
import { Stats } from "node:fs";
import { contentType } from "@std/media-types";

export async function addServeStatic(hono: Hono) {
  const rooDir = path.resolve(ENV.OSS_ROOT_DIR!);
  let rootDirRelative = rooDir;
  if (platform() === "win32") rootDirRelative = path.relative(".", rooDir); // hono@4.617 的 serveStatic 在 Windows 上存在bug (https://github.com/honojs/hono/issues/3475)
  console.log("useStatic", rootDirRelative);
  const oos = getBucket();
  const bucketTest = {
    AVATAR: new RegExp(`^/${oos.AVATAR}/`),
    PLA_POST_MEDIA: new RegExp(`^/${oos.PLA_POST_MEDIA}/`),
  };
  hono.use(
    "/file/*",
    await createRuntimeServeStatic({
      async onFound(path, c) {
        if (c.req.method !== "GET") return;
        const rel = path.slice(rooDir.length).replaceAll("\\", "/");
        if (bucketTest.AVATAR.test(rel)) {
          c.header("Cache-Control", "private, max-age=" + 86400 * 3);
          return;
        }
        if (bucketTest.PLA_POST_MEDIA.test(rel)) {
          c.header("Cache-Control", "private, max-age=86400");
          const userInfo = new UserInfo(getCookie(c, "jwt-token"));
          await userInfo.getJwtInfo();
          return;
        }
        throw new HTTPException(404, { res: new Response("访问不存在的资源地址") });
      },
      rewriteRequestPath(path) {
        const rel = path.replace(/^\/file\//, "/");
        if (rel.startsWith(`/${oos.AVATAR}/`)) {
          return rel;
        }
        if (bucketTest.PLA_POST_MEDIA.test(rel)) {
          //TODO 需要鉴权
          return rel;
        }
        throw new HTTPException(404, { res: new Response("访问不存在的资源地址") });
      },
      root: rootDirRelative,
    }),
  );
}

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
async function createRuntimeServeStatic(
  options: Pick<ServeStaticOptions, "rewriteRequestPath" | "root" | "onFound">,
): Promise<MiddlewareHandler> {
  const { rewriteRequestPath, onFound } = options;
  const rooDir = path.resolve(options.root ?? ".");

  return async function (ctx: Context, next: Next) {
    const method = ctx.req.method;
    if (!["HEAD", "GET"].includes(method)) return next();

    let pathname = ctx.req.path;
    if (rewriteRequestPath) pathname = rewriteRequestPath(pathname);
    const filename = path.resolve(rooDir, pathname.slice(1));
    let stat: Stats;
    try {
      stat = await fs.stat(filename);
    } catch (error) {
      if (error instanceof Error && (error as any).code === "ENOENT") {
        return ctx.text("文件不存在", 404);
      }
      throw error;
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
