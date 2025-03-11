import { user, enumPlatform, Platform, pla_user, user_platform_bind } from "@ijia/data/db";
import v, { dbPool } from "@ijia/data/yoursql";
import {
  BIndPlatformCheckDto,
  BindPlatformCheckParam,
  BindPlatformParam,
  UpdateUserProfileParam,
  UserProfileDto,
} from "./user.dto.ts";
import { array, checkType, enumType, optional } from "evlib/validator";
import { Controller, Get, Patch, PipeInput, Post, ToArguments, Use } from "@asla/hono-decorator";
import { HonoContext } from "@/hono/type.ts";
import { checkValue, checkValueAsync } from "@/global/check.ts";
import { autoBody } from "@/global/pipe.ts";
import { rolesGuard } from "@/global/auth.ts";
import { HttpError } from "@/global/errors.ts";
import { getCheckerServer, getUerSecIdFromShareUrl } from "@/services/douyin.ts";
import { deletePublicClass, setPublicClass } from "./user.service.ts";

@Use(rolesGuard)
@autoBody
@Controller({})
export class UserController {
  constructor() {}

  // @Patch("/user/profile")
  // updateUser(@Body() body: unknown) {}
  @ToArguments(async function (ctx: HonoContext) {
    const { userId } = await ctx.get("userInfo").getJwtInfo();
    const value = await checkValueAsync(ctx.req.json(), {
      platformList: array({
        platform: enumType(Array.from(enumPlatform)),
        pla_uid: "string",
      }),
    });

    return [userId, value.platformList];
  })
  @Post("/user/bind_platform")
  async bindPlatform(userId: string, list: BindPlatformParam["platformList"]) {
    const bind = list[0];
    if (bind.platform !== Platform.douYin) throw new HttpError(409, { message: "暂不支持绑定该平台" });
    const [plaUser] = await pla_user
      .select<{ signature?: string }>({ signature: true })
      .where(`platform=${v(bind.platform)} AND pla_uid=${v(bind.pla_uid)}`)
      .queryRows();
    if (!checkSignatureStudentId(userId, plaUser.signature)) {
      throw new HttpError(403, { message: "审核不通过。没有从账号检测到学号" });
    }
    await using q = dbPool.begin();
    await q.query(user_platform_bind.delete({ where: `platform=${v(bind.platform)} AND pla_uid=${v(bind.pla_uid)}` }));
    await q.queryCount(
      user_platform_bind.insert([{ pla_uid: bind.pla_uid, platform: bind.platform, user_id: +userId }]),
    );
    await q.commit();
  }

  @ToArguments(async function (ctx) {
    const { userId } = await ctx.get("userInfo").getJwtInfo();
    const param = checkValue(ctx.req.queries(), {
      platformList: array((item) => {
        const { value, error } = checkType(JSON.parse(item), {
          platform: enumType(Array.from(enumPlatform)),
          userHomeLink: optional.string,
          pla_uid: optional.string,
        });
        if (error) return { error };
        return { replace: true, value };
      }),
    });
    return [userId, param];
  })
  @Get("/user/bind_platform/check")
  async checkPlatformBind(userId: string, body: BindPlatformCheckParam): Promise<BIndPlatformCheckDto> {
    const bind = body.platformList[0];
    if (bind.platform !== Platform.douYin) throw new HttpError(409, { message: "暂不支持绑定该平台" });

    let pla_uid = bind.pla_uid;
    if (!pla_uid) {
      if (!bind.userHomeLink) throw new HttpError(400, { message: "userHomeLink 是必须的" });
      pla_uid = await getUerSecIdFromShareUrl(bind.userHomeLink);
    }
    const checkServer = getCheckerServer();
    const userInfo = await checkServer.checkUserBind(pla_uid, userId);
    if (!userInfo.pass) throw new HttpError(403, { message: userInfo.reason ?? "检测失败" });

    const [bindInfo] = await user_platform_bind
      .select<{
        user_id: number;
        platform: Platform;
        pla_uid: string;
      }>({
        user_id: true,
        platform: true,
        pla_uid: true,
      })
      .where([`platform=${v(bind.platform)}`, `pla_uid=${v(userInfo.pla_uid)}`])
      .limit(1)
      .queryRows();
    return {
      platformUser: userInfo,
      bind: bindInfo,
    };
  }

  @PipeInput(async function (ctx: HonoContext) {
    const jwtInfo = await ctx.get("userInfo").getJwtInfo();
    return +jwtInfo.userId;
  })
  @Get("/user/profile")
  async getUser(userId: number): Promise<UserProfileDto> {
    const users = await user
      .select<UserProfileDto>({ user_id: "id", avatar_url: "avatar", nickname: true })
      .where(`id=${v(userId)}`)
      .queryRows();
    return users[0];
  }
  @ToArguments(async function (ctx: HonoContext) {
    const jwtInfo = await ctx.get("userInfo").getJwtInfo();
    const body = await checkValueAsync(ctx.req.json(), "object");
    return [+jwtInfo.userId, body];
  })
  @Patch("/user/profile")
  async updateUserProfile(userId: number, body: UpdateUserProfileParam): Promise<void> {
    await using db = dbPool.begin();
    if (body.publicClassId !== undefined) {
      const count = await db.queryCount(deletePublicClass(userId));
      if (body.publicClassId !== null) {
        const count = await db.queryCount(setPublicClass(userId, body.publicClassId));
        if (count === 0) throw new HttpError(409, { message: "班级不存在" });
      }
    }
    if (body.notice) {
    }
    await db.commit();
  }
}

function checkSignatureStudentId(userId: number | string, signature?: string) {
  if (typeof signature !== "string") return false;
  return signature.includes(`IJIA学号：<${userId}>`);
}
export const userController = new UserController();
