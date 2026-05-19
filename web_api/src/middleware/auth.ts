import { getCookie, setCookie } from "hono/cookie";
import { HonoContext } from "@/common/context.ts";
import { REQUEST_AUTH_KEY } from "@ijia/api-types";
import { createUserInfo, UserInfo } from "@/common/userInfo.ts";
import { getValidUserSampleInfoByUserId } from "@/sql/user.ts";
import { HTTPException } from "hono/http-exception";
import { RequiredLoginError } from "@/common/errors.ts";
/**
 * 装饰后，会根据添加 userInfo 到 HonoContext 上
 */
export async function setUserInfo(ctx: HonoContext, next: () => Promise<void>): Promise<void | Response> {
  const userInfo = createUserInfo(getCookie(ctx, REQUEST_AUTH_KEY));
  ctx.set("userInfo", userInfo);
  await next();
  const accessToken = await userInfo.checkUpdateToken();
  if (accessToken.needDelete) {
    setCookie(ctx, REQUEST_AUTH_KEY, "", { maxAge: 0 });
  } else if (accessToken.needRefresh) {
    const userId = await userInfo.getUserId();
    await getValidUserSampleInfoByUserId(userId);
    const newToken = await userInfo.refreshToken();
    setCookie(ctx, REQUEST_AUTH_KEY, newToken.token, { maxAge: newToken.maxAge ?? undefined });
  }
}

async function checkRoles(userInfo: UserInfo, requiredAnyRoles: Set<string>) {
  if (!userInfo) throw new RequiredLoginError();
  if (requiredAnyRoles.size === 0) {
    // 只需要是有效用户
    const userId = await userInfo.getUserId();
    await getValidUserSampleInfoByUserId(userId);
  } else {
    const hasPermission = await userInfo.hasRolePermission(requiredAnyRoles);
    if (!hasPermission) {
      throw new HTTPException(403);
    }
  }
}

export function requiredRoles(...roles: string[]) {
  const requiredRoles = new Set(roles);
  return async (ctx: HonoContext, next: () => Promise<void>) => {
    const userInfo = ctx.get("userInfo");
    if (!userInfo) {
      throw new HTTPException(500, { message: "在使用 roles 中间件前请先设置 UserInfo 中间件" });
    }
    await checkRoles(userInfo, requiredRoles);
    return next();
  };
}

export async function requiredLogin(ctx: HonoContext, next: () => Promise<void>) {
  const userInfo = ctx.get("userInfo");
  const userId = await userInfo.getUserId();
  return next();
}
