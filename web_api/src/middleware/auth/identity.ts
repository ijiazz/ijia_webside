import { HonoContext } from "@/global/context.ts";
import { HTTPException } from "hono/http-exception";
import { getCookie, setCookie } from "hono/cookie";
import { UserInfo } from "./userInfo.ts";
import { RequiredLoginError } from "@/global/errors.ts";
import { getValidUserSampleInfoByUserId } from "@/sql/user.ts";
import { REQUEST_AUTH_KEY } from "@/dto.ts";
/**
 * 装饰后，会根据添加 userInfo 到 HonoContext 上
 */
export async function setUserInfo(ctx: HonoContext, next: () => Promise<void>): Promise<void | Response> {
  const userInfo = new UserInfo(getCookie(ctx, REQUEST_AUTH_KEY));
  ctx.set("userInfo", userInfo);
  await next();
  const accessToken = await userInfo.checkUpdateToken();
  if (accessToken) {
    setCookie(ctx, REQUEST_AUTH_KEY, accessToken.token, { maxAge: accessToken.maxAge ?? undefined });
  }
}
async function checkRoles(userInfo: UserInfo, requiredAnyRoles: Set<string>) {
  if (!userInfo) throw new RequiredLoginError();
  if (requiredAnyRoles.size === 0) {
    const userId = await userInfo.getUserId();
    await getValidUserSampleInfoByUserId(userId);
  } else {
    const { role_id_list } = await userInfo.getRolesFromDb();
    if (!role_id_list.some((role) => requiredAnyRoles.has(role))) {
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
