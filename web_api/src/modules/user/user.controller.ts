import { user, enumPlatform, Platform, pla_user, user_platform_bind, dclass, user_class_bind } from "@ijia/data/db";
import v, { dbPool } from "@ijia/data/yoursql";
import {
  BindPlatformCheckDto,
  BindPlatformCheckParam,
  BindPlatformParam,
  UpdateUserProfileParam,
  UserProfileDto,
} from "./user.dto.ts";
import { array, enumType, optional, stringMatch } from "evlib/validator";
import { Controller, Delete, Get, Patch, PipeInput, Post, ToArguments, Use } from "@asla/hono-decorator";
import { HonoContext } from "@/hono/type.ts";
import { checkValueAsync } from "@/global/check.ts";
import { autoBody } from "@/global/pipe.ts";
import { rolesGuard } from "@/global/auth.ts";
import { HttpError } from "@/global/errors.ts";
import { getCheckerServer, getUerSecIdFromShareUrl, PlatformUserBasicInfoCheckResult } from "@/services/douyin.ts";
import { deletePublicClass, setPublicClass } from "./user.service.ts";
import { toErrorStr } from "evlib";
import { ENV, Mode } from "@/global/config.ts";

@Use(rolesGuard)
@autoBody
@Controller({})
export class UserController {
  constructor() {
    if (ENV.MODE !== Mode.Prod) {
      console.warn("非生产环境，账号绑定检测通过数据库检测");
    }
  }

  // @Patch("/user/profile")
  // updateUser(@Body() body: unknown) {}
  @ToArguments(async function (ctx: HonoContext) {
    const { userId } = await ctx.get("userInfo").getJwtInfo();
    const value = await checkValueAsync(ctx.req.json(), {
      account: {
        platform: enumType(Array.from(enumPlatform)),
        pla_uid: "string",
      },
    });

    return [userId, value.account];
  })
  @Post("/user/bind_platform")
  async bindPlatform(userId: string, bind: BindPlatformParam["account"]) {
    if (bind.platform !== Platform.douYin) throw new HttpError(409, { message: "暂不支持绑定该平台" });
    const [plaUser] = await pla_user
      .select<{ signature?: string }>({ signature: true })
      .where(`platform=${v(bind.platform)} AND pla_uid=${v(bind.pla_uid)}`)
      .queryRows();
    if (!plaUser) throw new HttpError(400, { message: "平台账号不存在" });
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
    const param = await checkValueAsync(ctx.req.json(), { bindKey: "string" });
    return [userId, param.bindKey];
  })
  @Delete("/user/bind_platform")
  async deletePlatformBind(userId: string, key: string) {
    const [platform, pla_uid] = key.split("-");
    const bind = {
      platform,
      pla_uid,
    };
    const count = await user_platform_bind
      .delete({ where: `platform=${v(bind.platform)} AND pla_uid=${v(bind.pla_uid)} AND user_id=${v(userId)}` })
      .queryCount();
    if (count === 0) throw new HttpError(409, { message: "未找到绑定" });
  }

  @ToArguments(async function (ctx) {
    const { userId } = await ctx.get("userInfo").getJwtInfo();
    const param = await checkValueAsync(ctx.req.json(), {
      platformList: array({
        platform: enumType(Array.from(enumPlatform)),
        userHomeLink: optional(stringMatch(/https?:\/\/.+/)),
        platformUseId: optional.string,
      }),
    });
    return [+userId, param];
  })
  @Post("/user/bind_platform/check")
  async checkPlatformBind(userId: number, body: BindPlatformCheckParam): Promise<BindPlatformCheckDto> {
    const bind = body.platformList[0];
    if (bind.platform !== Platform.douYin) throw new HttpError(409, { message: "暂不支持绑定该平台" });

    /** 抖音是 sec_id */
    let platformUseId = bind.platformUseId;
    if (!platformUseId) {
      if (!bind.userHomeLink) throw new HttpError(400, { message: "userHomeLink 是必须的" });
      try {
        platformUseId = await getUerSecIdFromShareUrl(bind.userHomeLink);
      } catch (error) {
        throw new HttpError(502, { message: toErrorStr(error) });
      }
    }
    let userInfo: PlatformUserBasicInfoCheckResult;
    if (ENV.MODE === Mode.Prod) {
      const checkServer = getCheckerServer();
      try {
        userInfo = await checkServer.checkPlatformUserInfo(platformUseId, userId);
      } catch (error) {
        throw new HttpError(502, { message: toErrorStr(error) });
      }
    } else {
      userInfo = await getPlatformUserInfo(bind.platform, platformUseId, userId);
    }
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

  @PipeInput(getUserId)
  @Get("/user/profile")
  async getUser(userId: number): Promise<UserProfileDto> {
    const users = await user
      .fromAs("u")
      .select<UserProfileDto>({
        user_id: "id",
        avatar_url: "avatar",
        nickname: true,
        primary_class: `(SELECT row_to_json(pub_class) FROM ${getUserPublicClass(userId).toSelect()} AS pub_class)`,
        bind_accounts: `(SELECT json_agg(row_to_json(accounts)) FROM ${getUserBindAccount(userId).toSelect()} AS accounts)`,
      })
      .where(`u.id=${v(userId)}`)
      .limit(1)
      .queryRows();
    if (!users.length) throw new HttpError(400, { message: "用户不存在" });
    const userInfo = users[0];
    if (!userInfo.bind_accounts) userInfo.bind_accounts = [];
    userInfo.is_official = userInfo.bind_accounts.length > 0;
    return userInfo;
  }

  @ToArguments(async function (ctx) {
    const jwtInfo = await ctx.get("userInfo").getJwtInfo();
    const param = await checkValueAsync(ctx.req.json(), {
      bindKey: "string",
    });
    const [platform, pla_uid] = param.bindKey.split("-");

    return [+jwtInfo.userId, { platform: platform as Platform, pla_uid }];
  })
  @Post("/user/profile/sync")
  async syncPlatformAccount(userId: number, param: { platform: Platform; pla_uid: string }): Promise<void> {
    //TODO
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

async function getUserId(ctx: HonoContext) {
  const jwtInfo = await ctx.get("userInfo").getJwtInfo();
  return +jwtInfo.userId;
}
function getUserPublicClass(userId: number) {
  return user_class_bind
    .fromAs("bind_class")
    .innerJoin(dclass, "class", [
      `bind_class.user_id=${v(userId)}`,
      "bind_class.class_id=class.id",
      "class.parent_class_id IS NULL",
      "class.is_public",
    ])
    .select(["bind_class.class_id", "class.class_name"])
    .limit(1);
}
function getUserBindAccount(userId: number) {
  return user_platform_bind
    .fromAs("bind")
    .innerJoin(pla_user, "pla_user", [
      "bind.platform=pla_user.platform",
      `bind.user_id=${v(userId)}`,
      "bind.pla_uid=pla_user.pla_uid",
    ])
    .select({
      platform: "bind.platform",
      pla_uid: "bind.pla_uid",
      user_id: "bind.user_id",
      user_name: "pla_user.user_name",
      avatar_url: "pla_user.avatar",
      create_time: "bind.create_time",
      key: "bind.platform||'-'||bind.pla_uid",
    });
}
function checkSignatureStudentId(userId: number | string, signature?: string) {
  if (typeof signature !== "string") return false;
  return signature.includes(`IJIA学号：<${userId}>`);
}
export const userController = new UserController();

async function getPlatformUserInfo(
  platform: Platform,
  pla_uid: string,
  userId: number,
): Promise<PlatformUserBasicInfoCheckResult> {
  let where: string;
  if (platform === Platform.douYin) {
    where = `(extra->>'sec_uid')=${v(pla_uid)}`;
  } else {
    where = `pla_uid=${v(pla_uid)}`;
  }
  const [res] = await pla_user
    .select<{ platform: Platform; pla_uid: string; signature: string; avatar: string; user_name: string }>({
      pla_uid: true,
      signature: true,
      avatar: true,
      user_name: true,
      platform: true,
    })
    .where(where)
    .limit(1)
    .queryRows();
  if (!res) throw new HttpError(400, { message: "账号不存在" });
  if (!checkSignatureStudentId(userId, res.signature))
    throw new HttpError(403, { message: "审核不通过。没有从账号检测到学号" });
  return {
    pla_uid: res.pla_uid,
    avatarPath: res.avatar,
    description: res.signature,
    username: res.user_name,
    platform: res.platform,
    pass: true,
  };
}
