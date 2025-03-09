import { user, enumPlatform } from "@ijia/data/db";
import v from "@ijia/data/yoursql";
import { BindPlatformParam, UserProfileDto } from "./user.dto.ts";
import { optional, array, enumType } from "evlib/validator";
import { Controller, Get, PipeInput, Post, ToArguments, Use } from "@asla/hono-decorator";
import { HonoContext } from "@/hono/type.ts";
import { checkValue } from "@/global/check.ts";
import { autoBody } from "@/global/pipe.ts";
import { rolesGuard } from "@/global/auth.ts";

@Use(rolesGuard)
@autoBody
@Controller({})
export class UserController {
  constructor() {}

  // @Patch("/user/self/profile")
  // updateUser(@Body() body: unknown) {}
  @ToArguments(async function (ctx: HonoContext) {
    const body = await ctx.req.json();
    const userInfo = ctx.get("userInfo");
    const { userId } = await userInfo.getJwtInfo();
    const value = checkValue(body, {
      platformList: array({
        platform: enumType(Array.from(enumPlatform)),
        userHomeLink: optional.string,
        pla_uid: optional.string,
      }),
    });

    return [userId, value];
  })
  @Post("/user/self/bind_platform")
  async bindPlatform(userId: string, body: BindPlatformParam) {}

  @PipeInput(async function (ctx: HonoContext) {
    const userInfo = await ctx.get("userInfo");
    const jwtInfo = await userInfo.getJwtInfo();
    return +jwtInfo.userId;
  })
  @Get("/user/self/profile")
  async getUser(userId: number): Promise<UserProfileDto> {
    const users = await user
      .select<UserProfileDto>({ user_id: "id", avatar_url: "avatar", nickname: true })
      .where(`id=${v(userId)}`)
      .queryRows();
    return users[0];
  }
}

export const userController = new UserController();
