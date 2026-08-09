import { HonoContext } from "@/common/context.ts";
import { RouteGroup } from "@/lib/route.ts";

import { dbPool } from "@/db/client.ts";
import { signAccessToken } from "@/common/jwt.ts";
import { REQUEST_AUTH_KEY } from "@ijia/api-types";
import { Context } from "hono";
import { setCookie } from "hono/cookie";
import { v } from "@/sql/utils.ts";
import { HttpError } from "@/common/errors.ts";
import { checkValueAsync, queryInt } from "@/common/check.ts";
import { optional } from "@asla/wokao";

const routeGroup = new RouteGroup<HonoContext>();
export default routeGroup;

// 仅用于 e2e 测试，实际登录逻辑会更复杂
routeGroup.create({
  method: "POST",
  routePath: "/test/passport/login",
  async validateInput({ req }) {
    return checkValueAsync(req.json(), [{ email: "string", id: optional("undefined") }, { id: queryInt }] as const);
  },
  async handler(unsafeParam, ctx) {
    let id: number | undefined;
    if (typeof unsafeParam.id === "number") {
      id = unsafeParam.id;
    } else {
      const [info] = await dbPool.queryRows<{ id: number }>(
        v.gen`SELECT id FROM public.user WHERE email = ${unsafeParam.email}`,
      );
      if (info === undefined) {
        return new HttpError(404, { message: "账号不存在" });
      }
      id = info.id;
    }

    const jwtKey = await signToken(id);

    setCookieAuth(ctx, jwtKey.token, jwtKey.maxAge);
    return { token: jwtKey.token };
  },
});

async function signToken(userId: number) {
  const DAY = 24 * 60 * 60; // 一天的秒数
  const jwtKey = await signAccessToken(userId, {
    survivalSeconds: 60 * 60, // 60 分钟过期. 每60分钟需要刷新一次
    refreshKeepAliveSeconds: 7 * DAY, // 7 天内有操作可免登录
    refreshSurvivalSeconds: 30 * DAY, // 刷新 token 最多可以用 1 个月
  });

  return jwtKey;
}

function setCookieAuth(ctx: Context, value: string, maxAge: number | null): void {
  setCookie(ctx, REQUEST_AUTH_KEY, value, {
    maxAge: maxAge ?? undefined,
    secure: false,
    httpOnly: true,
    path: "/",
  });
}
