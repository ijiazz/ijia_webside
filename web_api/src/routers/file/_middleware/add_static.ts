import { Hono } from "hono";
import { ENV } from "@/config.ts";
import path from "node:path";
import { HTTPException } from "hono/http-exception";
import { UserInfo } from "@/middleware/auth.ts";
import { getCookie } from "hono/cookie";
import { getBucket } from "@ijia/data/oss";
import { REQUEST_AUTH_KEY } from "@/dto.ts";
import { createRuntimeServeStatic } from "./serve_static.ts";

export async function addServeStatic(hono: Hono) {
  const rooDir = path.resolve(ENV.OSS_ROOT_DIR!);
  console.log("useStatic", rooDir);
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
          const userInfo = new UserInfo(getCookie(c, REQUEST_AUTH_KEY));
          await userInfo.getUserId();
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
      root: rooDir,
    }),
  );
}
