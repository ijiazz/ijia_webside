import { MiddlewareHandler } from "hono";
import { ServeStaticOptions } from "hono/serve-static";
import { Hono } from "hono";
import { ENV } from "@/config.ts";
import path from "node:path";
import { platform } from "node:os";
import { HTTPException } from "hono/http-exception";
import { UserInfo } from "@/global/auth.ts";
import { getCookie } from "hono/cookie";
import { getBucket } from "@ijia/data/oss";

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
        const rel = path.slice(rooDir.length);
        if (bucketTest.AVATAR.test(rel)) return;
        if (bucketTest.ASSET_IMAGES.test(rel)) {
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
