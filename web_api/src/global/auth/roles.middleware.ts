import { jwtManage, SignInfo } from "@/crypto/jwt.ts";
import { NestHonoRequest } from "@/hono/type.ts";
import { Injectable, NestMiddleware, UnauthorizedException } from "@nestjs/common";
import { Context } from "hono";
import { getCookie } from "hono/cookie";
import { HonoResponse } from "nest-hono-adapter";

@Injectable()
export class RolesMiddleware implements NestMiddleware<Context, HonoResponse> {
  use = rolesMiddleware;
}
export function rolesMiddleware(req: NestHonoRequest, res: HonoResponse, next: (error?: any) => void) {
  let info: Promise<SignInfo> | undefined;
  let permissionsInfo: Promise<{}> | undefined;
  function getUserInfo() {
    if (!info) {
      const jwt_token = getCookie(req, "jwt_token");
      if (!jwt_token) throw new UnauthorizedException();
      info = jwtManage.verify(jwt_token);
    }
    return Promise.resolve(info);
  }
  req.set("getUserPermission", () => {
    if (!permissionsInfo)
      permissionsInfo = getUserInfo().then((info) => {
        return { userId: info.userId };
        //TODO 获取用户权限
      });
    return permissionsInfo;
  });
  req.set("getUserInfo", getUserInfo);
  next();
}
