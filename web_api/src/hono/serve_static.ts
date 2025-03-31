import { Context, MiddlewareHandler, Next } from "hono";
import { ServeStaticOptions } from "hono/serve-static";
import { Hono } from "hono";
import { ENV } from "@/config.ts";
import path from "node:path";
import { platform } from "node:os";
import { HTTPException } from "hono/http-exception";
import { UserInfo } from "@/global/auth.ts";
import { getCookie } from "hono/cookie";
import { getBucket } from "@ijia/data/oss";
import fs, { FileHandle } from "node:fs/promises";
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
    ASSET_IMAGES: new RegExp(`^/${oos.ASSET_IMAGES}/`),
    ASSET_VIDEO: new RegExp(`^/${oos.ASSET_VIDEO}/`),
    ASSET_AUDIO: new RegExp(`^/${oos.ASSET_AUDIO}/`),
  };
  hono.use(
    "/file/*",
    await createRuntimeServeStatic({
      async onFound(path, c) {
        if (c.req.method !== "GET") return;
        const rel = path.slice(rooDir.length);
        if (bucketTest.AVATAR.test(rel)) {
          c.header("Cache-Control", "private, max-age=" + 86400 * 3);
          return;
        }
        if (bucketTest.ASSET_IMAGES.test(rel)) {
          c.header("Cache-Control", "private, max-age=86400");
          const userInfo = new UserInfo(getCookie(c, "jwt-token"));
          await userInfo.getJwtInfo();
        }
        throw new HTTPException(404);
      },
      rewriteRequestPath(path) {
        const rel = path.replace(/^\/file\//, "/");
        if (rel.startsWith(`/${oos.AVATAR}/`)) {
          return rel;
        }
        if (/^\/(height_image)\//.test(rel)) return rel;
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

const defaultChunkSize = 1024 * 32;
class RangeRead {
  constructor(public end?: number) {}
  getChunkSize(offset: number) {
    if (this.end === undefined) {
      return defaultChunkSize;
    }
    let readSize: number;
    if (this.end - offset >= defaultChunkSize) readSize = defaultChunkSize;
    else readSize = this.end - offset;
    return readSize;
  }
}
function getFileStreamNode(path: string, rangeStart?: number, rangeEnd?: number): ReadableStream<Uint8Array> {
  let fd: FileHandle;

  let offset = rangeStart ?? 0;
  const rangeRead = new RangeRead(rangeEnd);

  return new ReadableStream({
    cancel() {
      return fd.close();
    },
    async start() {
      fd = await fs.open(path, "r");
    },
    async pull(ctrl) {
      const readSize = rangeRead.getChunkSize(offset);
      const chunk = new Uint8Array(readSize);
      const { bytesRead } = await fd.read(chunk, offset, readSize);
      offset += bytesRead;
      if (bytesRead === 0) {
        ctrl.close();
        return fd.close();
      } else if (bytesRead < readSize) {
        ctrl.enqueue(chunk.subarray(0, bytesRead));
        ctrl.close();
        return fd.close();
      } else {
        ctrl.enqueue(chunk);
      }
    },
  });
}
function getFileStreamDeno(path: string, rangeStart?: number, rangeEnd?: number): ReadableStream<Uint8Array> {
  //@ts-ignore
  let fd: Deno.FsFile;
  return new ReadableStream({
    cancel() {
      return fd.close();
    },
    async start() {
      //@ts-ignore
      fd = await Deno.open(path);
      if (rangeStart) {
        //@ts-ignore
        await fd.seek(rangeStart, Deno.SeekMode.Start);
      }
      if (rangeEnd) {
        //@ts-ignore
        await fd.seek(rangeEnd, Deno.SeekMode.End);
      }
    },
    async pull(ctrl) {
      const chunk = new Uint8Array(defaultChunkSize);
      const bytesRead = await fd.read(chunk);
      if (bytesRead === null || bytesRead === 0) {
        ctrl.close();
        return fd.close();
      } else if (bytesRead < defaultChunkSize) {
        ctrl.enqueue(chunk.subarray(0, bytesRead));
        ctrl.close();
        return fd.close();
      } else {
        ctrl.enqueue(chunk);
      }
    },
  });
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
  //@ts-ignore
  const isDeno: boolean = typeof globalThis.Deno === "object";
  const getFileStream = isDeno ? getFileStreamDeno : getFileStreamNode;

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

    ctx.header("Content-Length", stat.size.toString());
    ctx.header("Content-Type", contentType(filename));
    ctx.header("Accept-Ranges", "bytes");

    await onFound?.(filename, ctx);
    if (method === "HEAD") return ctx.body(null, 200);
    if (await isCached(stat.mtime, ctx)) return ctx.body(null, 304);

    const range = ctx.req.header("Range");
    if (range) {
      const ifRangeStr = ctx.req.header("If-Range");
      if (!ifRangeStr || ifRangeStr === stat.mtime.toUTCString()) {
        const { end, start } = getHttpHeaderRange(range);

        ctx.header("Content-Range", `bytes ${start}-${end}/${stat.size}`);
        ctx.status(206);
        return ctx.body(getFileStream(filename, start, end));
      }
    }

    return ctx.body(getFileStream(filename));
  };
}
