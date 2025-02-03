import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Permissions, Roles } from "./roles.decorator.ts";
import { NestHonoRequest } from "@/hono/type.ts";

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(context: ExecutionContext): Promise<boolean> | boolean {
    const handler = context.getHandler();
    const permissions = this.reflector.get(Permissions, handler);
    const roles = this.reflector.get(Roles, handler);

    if (!permissions && !roles) return true;

    const ctx = context.switchToHttp().getRequest<NestHonoRequest>();
    const getUserInfo = ctx.get("getUserPermission");
    if (!getUserInfo) return false;

    return getUserInfo().then(
      (user) => {
        //TODO check role
        return true;
      },
      () => false,
    );
  }
}
