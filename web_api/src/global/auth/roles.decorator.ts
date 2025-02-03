import { Reflector } from "@nestjs/core";
import { createParamDecorator } from "@nestjs/common";
import { NestHonoRequest } from "@/hono/type.ts";

export const Permissions = Reflector.createDecorator<string[]>();
export const Roles = Reflector.createDecorator<string[]>();

export const UserId = createParamDecorator<void>(async function (data, nestCtx) {
  const ctx = nestCtx.switchToHttp().getRequest<NestHonoRequest>();
  const getUserInfo = ctx.get("getUserPermission");
  return getUserInfo();
});
