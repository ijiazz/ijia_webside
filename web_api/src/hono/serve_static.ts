import { MiddlewareHandler } from "hono";
import { ServeStaticOptions } from "hono/serve-static";
import { Hono } from "hono";
import { ENV } from "@/global/config.ts";
import path from "node:path";
import { platform } from "node:os";

async function createRuntimeServeStatic(options: ServeStaticOptions): Promise<MiddlewareHandler> {
  //@ts-ignore
  if (typeof globalThis.Deno === "object") {
    const { serveStatic } = await import("hono/deno");
    return serveStatic(options);
  } else {
    const { serveStatic } = await import("@hono/node-server/serve-static");
    return serveStatic(options);
  }
}

export async function addServeStatic(hono: Hono) {
  //TODO 控制 OOS 访问
  let rootDir = path.resolve(ENV.OOS_ROOT_DIR!);
  if (platform() === "win32") rootDir = path.relative(".", rootDir); // hono@4.617 的 serveStatic 在 Windows 上存在bug (https://github.com/honojs/hono/issues/3475)
  console.log("useStatic", rootDir);
  hono.use(
    "/file/*",
    await createRuntimeServeStatic({
      rewriteRequestPath(path) {
        return path.replace(/^\/file\//, "/");
      },
      root: rootDir,
    }),
  );
}
