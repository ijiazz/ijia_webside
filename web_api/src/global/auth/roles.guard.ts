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

async function checkRoles(ctx: HonoContext, requiredAnyRoles?: Set<string>) {
  if (!requiredAnyRoles) return;
  const userInfo = ctx.get("userInfo");
  if (!userInfo) throw new HTTPException(401);

  const userRoles = await userInfo.getRoles();
  if (!userRoles.some((role) => requiredAnyRoles.has(role))) {
    throw new HTTPException(403);
  }
}
export async function rolesGuard(ctx: HonoContext, next: () => Promise<void>): Promise<void | Response> {
  ctx.set("userInfo", new UserInfo(getCookie(ctx, "jwt-token")));

  const endpointCtx = getEndpointContext(ctx);
  const controllerRoles = endpointCtx.getControllerMetadata<Set<string>>(Roles);
  if (!controllerRoles) await checkRoles(ctx, controllerRoles);

  const endpointRoles = endpointCtx.getEndpointMetadata<Set<string>>(Roles);
  if (!endpointRoles) await checkRoles(ctx, endpointRoles);
  return next();
}
/** 装饰后，需要包含指定角色的用户才有权限访问接口 */
export const Roles: (...args: string[]) => EndpointDecorator = createMetadataDecoratorFactory<Set<string>, string[]>(
  function (roles, ctx) {
    if (!ctx.metadata) return new Set(roles);
    throw new DecorateReuseError("Roles");
  },
);
