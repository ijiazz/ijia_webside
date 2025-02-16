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
  function getUserInfo() {
    if (!info) {
      const jwt_token = getCookie(req, "jwt_token");
      if (!jwt_token) throw new UnauthorizedException();
      info = jwtManage.verify(jwt_token);
    }
    return Promise.resolve(info);
  }
  req.set("getUserInfo", getUserInfo);
  next();
}
