import { HonoContext } from "@/hono/type.ts";
import {
  getEndpointContext,
  createMetadataDecoratorFactory,
  DecorateReuseError,
  EndpointDecorator,
} from "@asla/hono-decorator";
import { HTTPException } from "hono/http-exception";
import { getCookie } from "hono/cookie";
import { UserInfo } from "./userInfo.ts";
import { RequiredLoginError } from "../errors.ts";
async function checkRoles(userInfo: UserInfo, requiredAnyRoles: Set<string>) {
  if (!userInfo) throw new RequiredLoginError();
  if (requiredAnyRoles.size === 0) {
    await userInfo.getUserInfo();
  } else {
    const userRoles = await userInfo.getRoles();
    if (!userRoles.some((role) => requiredAnyRoles.has(role))) {
      throw new HTTPException(403);
    }
  }
}
/**
 * 装饰后，会根据添加 userInfo 到 HonoContext 上
 */
export async function rolesGuard(ctx: HonoContext, next: () => Promise<void>): Promise<void | Response> {
  const userInfo = new UserInfo(getCookie(ctx, "jwt-token"));
  ctx.set("userInfo", userInfo);

  const endpointCtx = getEndpointContext(ctx);
  const controllerRoles = endpointCtx.getControllerMetadata<Set<string>>(Roles);
  if (controllerRoles) await checkRoles(userInfo, controllerRoles);

  const endpointRoles = endpointCtx.getEndpointMetadata<Set<string>>(Roles);
  if (endpointRoles) await checkRoles(userInfo, endpointRoles);
  return next();
}
/**
 * 装饰后，需要包含指定角色的用户才有权限访问接口
 * 只在 rolesGuard 装饰的 Controller 上生效
 *
 * 如果提供多个角色，则只需要用户包含其中一个角色即可
 * 如果为空，则表示需要是有效的登录用户
 */
export const Roles: (...args: string[]) => EndpointDecorator = createMetadataDecoratorFactory<Set<string>, string[]>(
  function (roles, ctx) {
    if (!ctx.metadata) return new Set(roles);
    throw new DecorateReuseError("Roles");
  },
);
