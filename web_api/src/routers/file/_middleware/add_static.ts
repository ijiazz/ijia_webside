import { Context, Hono } from "hono";
import { ENV } from "@/config.ts";
import path from "node:path";
import { HTTPException } from "hono/http-exception";
import { Role, UserInfo } from "@/middleware/auth.ts";
import { getCookie } from "hono/cookie";
import { getBucket } from "@ijia/data/oss";
import { REQUEST_AUTH_KEY } from "@/dto.ts";
import { createRuntimeServeStatic } from "./serve_static.ts";

type FileContext = Context<{
  Variables: {
    userInfo: UserInfo;
    bucket: {
      name: string;
    };
  };
}>;
const TEMP_BUCKET_NAME = "_temp";
export async function addServeStatic(hono: Hono) {
  const rooDir = path.resolve(ENV.OSS_ROOT_DIR!);
  console.log("useStatic", rooDir);
  const oss = getBucket();

  hono.use(
    "/file/*",
    async (context, next) => {
      const ctx = context as unknown as FileContext;
      const userInfo = new UserInfo(getCookie(context, REQUEST_AUTH_KEY));
      ctx.set("userInfo", userInfo);

      const pathname = ctx.req.path;
      const rel = pathname.replace(/^\/file\//, "/");

      if (rel.startsWith(`/${oss.AVATAR}/`)) {
        ctx.set("bucket", { name: oss.AVATAR });
        return next();
      } else if (rel.startsWith(`/${TEMP_BUCKET_NAME}/`)) {
        ctx.set("bucket", { name: TEMP_BUCKET_NAME });
        return next();
      } else if (rel.startsWith(`/${oss.PLA_POST_MEDIA}/`)) {
        const hasPermission = await userInfo.hasRolePermission(Role.Admin);
        if (!hasPermission) {
          throw new HTTPException(403, { res: new Response("没有权限访问") });
        }
        ctx.set("bucket", { name: oss.PLA_POST_MEDIA });
        return next();
      }
      throw new HTTPException(404, { res: new Response("访问不存在的资源地址") });
    },
    await createRuntimeServeStatic({
      async onFound(path, c) {
        const ctx = c as unknown as FileContext;
        if (c.req.method !== "GET") return;
        const bucket = ctx.get("bucket").name;
        switch (bucket) {
          case TEMP_BUCKET_NAME:
            c.header("Cache-Control", "private, max-age=86400");
            break;
          case oss.AVATAR:
            c.header("Cache-Control", "private, max-age=" + 86400 * 3);
            break;

          case oss.COMMENT_IMAGE:
          case oss.PLA_POST_MEDIA:
            c.header("Cache-Control", "private, max-age=86400");
            break;
          default:
            break;
        }
      },
      rewriteRequestPath(path) {
        return path.replace(/^\/file\//, "/");
      },
      root: rooDir,
    }),
  );
}
