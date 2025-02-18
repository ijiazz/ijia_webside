import { DbUserClassBindCreate, user, user_class_bind } from "@ijia/data/db";
import v, { getDbPool } from "@ijia/data/yoursql";
import { BadRequestException, Body, Controller, Get, Post, Res } from "@nestjs/common";
import {
  LoginType,
  UserLoginResultDto,
  UserProfileDto,
  type CreateUserProfileParam,
  type CreateUserProfileResult,
  type UserLoginParamDto,
} from "./user.type.ts";
import { validator } from "@/global/checker.pipe.ts";
import { checkType, typeChecker } from "evlib";
import { LoginService } from "./services/Login.service.ts";
import { hashPassword } from "./services/password.ts";
import { setCookie } from "hono/cookie";
import type { HonoResponse } from "nest-hono-adapter";
import { UserInfo } from "@/global/auth.ts";
import type { SignInfo } from "@/crypto/jwt.ts";

const { optional, array, enumType } = typeChecker;
@Controller()
export class UserController {
  constructor(private loginService: LoginService) {}
  @Post("/user/profile")
  async createUser(
    @Body(
      validator({
        email: "string",
        password: optional.string,
        classId: optional(array.number),
      }),
    )
    body: CreateUserProfileParam,
  ): Promise<CreateUserProfileResult> {
    const db = getDbPool().begin();
    const createUserSql = user
      .insert({ email: body.email, password: body.password })
      .returning<{ userId: number }>({ userId: "id" });
    const result = await db.queryRows(createUserSql);

    const createdUser = result[0];

    if (body.classId) {
      const bind = body.classId.map(
        (classId): DbUserClassBindCreate => ({ class_id: classId, user_id: createdUser.userId }),
      );
      await db.query(user_class_bind.insert(bind));
    }
    await db.commit();

    return createdUser;
  }
  // @Patch("/user/self/profile")
  // updateUser(@Body() body: unknown) {}
  @Post("/user/self/bind_platform")
  async bindPlatform(@Body() body: unknown) {}

  @Get("/user/self/profile")
  async getUser(@UserInfo() userInfo: SignInfo): Promise<UserProfileDto> {
    const users = await user
      .select<UserProfileDto>({ userId: "id", avatarUrl: "avatar", nickname: true })
      .where(`id=${v(userInfo.userId)}`)
      .queryRows();
    return users[0];
  }

  @Post("/user/login")
  async login(
    @Body(validator({ method: enumType(["id", "email"]) })) body: UserLoginParamDto,
    @Res() res: HonoResponse,
  ): Promise<UserLoginResultDto | void> {
    let user: { userId: number };
    switch (body.method) {
      case LoginType.id: {
        const { value, error } = checkType(
          body,
          { id: "string", password: "string", passwordNoHash: optional.boolean },
          { policy: "delete" },
        );
        if (error) throw new BadRequestException(error);
        if (value.passwordNoHash) value.password = await hashPassword(value.password);

        user = await this.loginService.loginById(value.id, value.password);
        break;
      }
      case LoginType.email: {
        const { value, error } = checkType(
          body,
          { email: "string", password: "string", passwordNoHash: optional.boolean },
          { policy: "delete" },
        );
        if (error) throw new BadRequestException(error);
        if (value.passwordNoHash) value.password = await hashPassword(value.password);

        user = await this.loginService.loginByEmail(value.email, value.password);
        break;
      }
      default:
        return { success: false, message: "方法不允许" };
    }
    if (!user) {
      return {
        success: false,
        message: "密码错误或用户不存在",
      };
    }

    const minute = 3 * 24 * 60; // 3 天后过期
    const jwtKey = await this.loginService.signJwt(user.userId, minute);
    setCookie(res, "jwt-token", jwtKey);
    res.send(
      res.json({
        success: true,
        message: "登录成功",
      }),
    );
  }
}
