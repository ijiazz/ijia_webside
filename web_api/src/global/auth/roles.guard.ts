import { HonoContext } from "@/hono/type.ts";
import {
  getEndpointContext,
  createMetadataDecoratorFactory,
  DecorateReuseError,
  EndpointDecorator,
} from "@asla/hono-decorator";
import * as userService from "./user.service.ts";

export function rolesGuard(ctx: HonoContext, next: () => Promise<void>): Promise<void | Response> | Response {
  const endpointCtx = getEndpointContext(ctx);
  //TODO
  // const controllerRoles = endpointCtx.getControllerMetadata<Set<string>>(Roles);
  // if (!controllerRoles) {
  // }

  const endpointRoles = endpointCtx.getEndpointMetadata<Set<string>>(Roles);
  if (!endpointRoles) return next();

  const getUserInfo = ctx.get("getUserInfo");
  if (!getUserInfo) return ctx.body(null, 401);

  return getUserInfo().then(
    (user) => {
      const hasRole = userService.includeRoles(+user.userId, Array.from(endpointRoles));
      if (!hasRole) return ctx.body(null, 403);
    },
    () => {
      return ctx.body(null, 401);
    },
  );
}
/** 装饰后，需要包含指定角色的用户才有权限访问接口 */
export const Roles: (...args: string[]) => EndpointDecorator = createMetadataDecoratorFactory<Set<string>, string[]>(
  function (roles, ctx) {
    if (!ctx.metadata) return new Set(roles);
    throw new DecorateReuseError("Roles");
  },
);
