import { DbUserClassBindCreate, user, user_class_bind } from "@ijia/data/db";
import v, { getDbPool } from "@ijia/data/yoursql";
import {
  LoginType,
  UserLoginResultDto,
  UserProfileDto,
  type CreateUserProfileParam,
  type CreateUserProfileResult,
  type UserLoginParamDto,
} from "./user.type.ts";
import { optional, array, enumType } from "evlib/validator";
import { loginService } from "./services/Login.service.ts";
import { hashPassword } from "./services/password.ts";
import { setCookie } from "hono/cookie";
import { Controller, Get, PipeInput, PipeOutput, Post } from "@asla/hono-decorator";
import { Context } from "hono";
import { HonoContext } from "@/hono/type.ts";
import { checkValue } from "@/global/check.ts";

@Controller({})
export class UserController {
  constructor() {}
  @PipeInput(async function (ctx) {
    const value = checkValue(
      await ctx.req.json(),
      {
        email: "string",
        password: optional.string,
        classId: optional(array.number),
      },
      { policy: "pass" },
    );
    return [value];
  })
  @Post("/user/profile")
  async createUser(body: CreateUserProfileParam): Promise<CreateUserProfileResult> {
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
  @PipeInput(async function (ctx) {
    return [await ctx.req.json()];
  })
  @Post("/user/self/bind_platform")
  async bindPlatform(body: unknown) {}

  @PipeInput(async function (ctx: HonoContext) {
    const userInfo = await ctx.get("userInfo");
    const jwtInfo = await userInfo.getJwtInfo();
    return [+jwtInfo.userId];
  })
  @Get("/user/self/profile")
  async getUser(userId: number): Promise<UserProfileDto> {
    const users = await user
      .select<UserProfileDto>({ userId: "id", avatarUrl: "avatar", nickname: true })
      .where(`id=${v(userId)}`)
      .queryRows();
    return users[0];
  }

  @PipeOutput(function (value: UserLoginResultDto | Response | void, ctx) {
    if (value instanceof Response) return value;
    if (value) return ctx.json(value, 200);
    return ctx.body(null, 200);
  })
  @PipeInput(async function (ctx) {
    const body: UserLoginParamDto = checkValue(
      await ctx.req.json(),
      {
        method: enumType(["id", "email"]),
      },
      { policy: "pass" },
    ) as UserLoginParamDto;
    return [body, ctx];
  })
  @Post("/user/login")
  async login(body: UserLoginParamDto, ctx: Context): Promise<UserLoginResultDto | Response | void> {
    let user: { userId: number };
    switch (body.method) {
      case LoginType.id: {
        const value = checkValue(
          body,
          { id: "string", password: "string", passwordNoHash: optional.boolean },
          { policy: "delete" },
        );
        if (value.passwordNoHash) value.password = await hashPassword(value.password);

        user = await loginService.loginById(+value.id, value.password);
        break;
      }
      case LoginType.email: {
        const value = checkValue(
          body,
          { email: "string", password: "string", passwordNoHash: optional.boolean },
          { policy: "delete" },
        );
        if (value.passwordNoHash) value.password = await hashPassword(value.password);

        user = await loginService.loginByEmail(value.email, value.password);
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
    const jwtKey = await loginService.signJwt(user.userId, minute);
    setCookie(ctx, "jwt-token", jwtKey);

    return ctx.json({
      success: true,
      message: "登录成功",
    });
  }
}
