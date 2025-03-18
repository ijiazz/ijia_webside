import { enumPlatform, Platform, pla_user, user_platform_bind, user_profile, user } from "@ijia/data/db";
import v, { dbPool } from "@ijia/data/yoursql";
import {
  BindPlatformCheckDto,
  BindPlatformCheckParam,
  BindPlatformParam,
  UpdateUserProfileParam,
  UserBasicDto,
  UserProfileDto,
} from "./user.dto.ts";
import { array, enumType, optional, stringMatch } from "evlib/validator";
import { Controller, Delete, Get, Patch, PipeInput, Post, ToArguments, Use } from "@asla/hono-decorator";
import { HonoContext } from "@/hono/type.ts";
import { checkValue, checkValueAsync } from "@/global/check.ts";
import { autoBody } from "@/global/pipe.ts";
import { rolesGuard } from "@/global/auth.ts";
import { HttpError } from "@/global/errors.ts";
import { getCheckerServer, getUerSecIdFromShareUrl, PlatformUserBasicInfoCheckResult } from "@/services/douyin.ts";
import {
  bindPlatformAccount,
  checkSignatureStudentId,
  deletePublicClassOfUser,
  getUserBasic,
  getUserProfile,
  setUserPublicClass,
} from "./user.service.ts";
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

    return [+userId, value.account];
  })
  @Post("/user/bind_platform")
  async bindPlatform(userId: number, bind: BindPlatformParam["account"]) {
    if (bind.platform !== Platform.douYin) throw new HttpError(409, { message: "暂不支持绑定该平台" });
    const [{ count }] = await user_platform_bind
      .select<{ count: number }>("count(*) ::INT")
      .where(`user_id=${v(userId)}`)
      .queryRows();
    if (count > 5) throw new HttpError(409, { message: "最多绑定5个平台账号" });
    await bindPlatformAccount(userId, bind.platform, bind.pla_uid);
    if (count === 0) {
      await this.syncPlatformAccountFromDb(userId, bind);
    }
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
      userInfo = await checkServer.checkPlatformUserInfo(platformUseId, userId);
      const [user] = await pla_user
        .select({ avatar: true })
        .where(`platform=${v(userInfo.platform)} AND pla_uid=${v(userInfo.pla_uid)}`)
        .limit(1)
        .queryRows();
      if (user?.avatar) userInfo.avatarPath = `/file/avatar/${user.avatar}`;
    } else {
      userInfo = await getPlatformUserInfo(bind.platform, platformUseId, userId);
    }
    if (!userInfo.pass) throw new HttpError(403, { message: "检测不通过" });

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
  @Get("/user/basic_info")
  async getUserBasic(userId: number): Promise<UserBasicDto> {
    return getUserBasic(userId);
  }

  @PipeInput(getUserId)
  @Get("/user/profile")
  async getUserProfile(userId: number): Promise<UserProfileDto> {
    return getUserProfile(userId);
  }

  @ToArguments(async function (ctx: HonoContext) {
    const jwtInfo = await ctx.get("userInfo").getJwtInfo();
    const body = await checkValueAsync(ctx.req.json(), "object");
    return [+jwtInfo.userId, body];
  })
  @Patch("/user/profile")
  async updateUserProfile(userId: number, body: UpdateUserProfileParam): Promise<void> {
    const { notice_setting, primary_class_id } = body;
    await using db = dbPool.begin();
    if (primary_class_id !== undefined) {
      const classId = checkValue(primary_class_id, optional("number", null)) as number | null;
      const count = await db.queryCount(deletePublicClassOfUser(userId));
      if (body.primary_class_id !== null) {
        const count = await db.queryCount(setUserPublicClass(userId, classId));
        if (count === 0) throw new HttpError(409, { message: "班级不存在" });
      }
    }
    if (notice_setting) {
      if (notice_setting.live !== undefined) {
        const sql = user_profile
          .insert({ user_id: userId, live_notice: notice_setting.live })
          .onConflict("user_id")
          .doUpdate({ live_notice: v(notice_setting.live) });

        await db.queryCount(sql);
      }
    }
    await db.commit();
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
    if (ENV.MODE === Mode.Prod) {
      if (param.platform === Platform.douYin) {
        const [info] = await pla_user
          .select({ sec_uid: "(extra->>'sec_uid')" })
          .where(`platform=${v(param.platform)} AND pla_uid=${v(param.pla_uid)}`)
          .queryRows();
        if (info) await getCheckerServer().syncUserInfo(param.platform, info.sec_uid);
        else throw new HttpError(404, { message: "账号不存在" });
      } else {
        await getCheckerServer().syncUserInfo(param.platform, param.pla_uid);
      }
    }
    await this.syncPlatformAccountFromDb(userId, param);
  }
  private async syncPlatformAccountFromDb(userId: number, param: { platform: Platform; pla_uid: string }) {
    const targetData = user_platform_bind
      .fromAs("bind")
      .innerJoin(pla_user, "p_u", [`bind.platform=p_u.platform`, `bind.pla_uid=p_u.pla_uid`])
      .select({
        user_id: "bind.user_id",
        platform: "p_u.platform",
        pla_uid: "p_u.pla_uid",
        user_name: "p_u.user_name",
        avatar: "p_u.avatar",
      })
      .where([`bind.platform=${v(param.platform)}`, `bind.pla_uid=${v(param.pla_uid)}`, `bind.user_id=${v(userId)}`]);

    const update = user.update({
      avatar: "target.avatar",
      nickname: "target.user_name",
    });
    const sql = `${update.toString()} FROM ${targetData.toSelect()} AS target WHERE public.user.id=target.user_id`;
    const count = await dbPool.queryCount(sql);
    if (count === 0) throw new HttpError(403, { message: "账号不存在" });
    if (count !== 1) throw new Error("修改超过一个账号" + sql);
  }
}

async function getUserId(ctx: HonoContext) {
  const jwtInfo = await ctx.get("userInfo").getJwtInfo();
  return +jwtInfo.userId;
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
