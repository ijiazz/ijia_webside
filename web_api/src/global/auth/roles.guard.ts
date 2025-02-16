import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Required, Roles } from "./roles.decorator.ts";
import { NestHonoRequest } from "@/hono/type.ts";
import { UserService } from "./user.service.ts";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private userService: UserService,
  ) {}
  canActivate(context: ExecutionContext): Promise<boolean> | boolean {
    const handler = context.getHandler();
    const permissions = this.reflector.get(Roles, handler);
    const roles = this.reflector.get(Roles, handler);

    if ((!permissions && !roles) || roles.length === 0) return true;

    const ctx = context.switchToHttp().getRequest<NestHonoRequest>();
    const getUserInfo = ctx.get("getUserInfo");
    if (!getUserInfo) return false;

    return getUserInfo().then(
      (user) => {
        return this.userService.includeRoles(+user.userId, roles);
      },
      () => false,
    );
  }
}

@Injectable()
export class LoginGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(context: ExecutionContext): Promise<boolean> | boolean {
    const handler = context.getHandler();
    const required = this.reflector.get(Required, handler) ?? { needLogin: true };
    if (required.needLogin) {
      const ctx = context.switchToHttp().getRequest<NestHonoRequest>();
      const getUserInfo = ctx.get("getUserInfo");
      if (!getUserInfo) return false;
      return getUserInfo().then(
        (user) => true,
        () => false,
      );
    }
    return true;
  }
}
