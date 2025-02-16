import { Reflector } from "@nestjs/core";
import { createParamDecorator } from "@nestjs/common";
import { NestHonoRequest } from "@/hono/type.ts";

export const Permissions = Reflector.createDecorator<string[]>();
/** 装饰后，需要包含指定角色的用户才有权限访问接口 */
export const Roles = Reflector.createDecorator<string[]>();

/** 装饰后，需要登录后才能访问 */
export const Required = Reflector.createDecorator<{ needLogin?: boolean }>();
export function Public() {
  return Required({ needLogin: false });
}

export const UserInfo = createParamDecorator<void>(async function (data, nestCtx) {
  const ctx = nestCtx.switchToHttp().getRequest<NestHonoRequest>();
  const getUserInfo = ctx.get("getUserInfo");
  return getUserInfo();
});
