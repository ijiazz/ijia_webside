import {
  enumPlatform,
  Platform,
  pla_user,
  user_platform_bind,
  user_profile,
  user,
  DbUserProfileCreate,
  user_class_bind,
  PUBLIC_CLASS_ROOT_ID,
  dclass,
} from "@ijia/data/db";
import { dbPool } from "@ijia/data/dbclient";
import {
  BindPlatformCheckDto,
  BindPlatformCheckParam,
  BindPlatformParam,
  UpdateUserProfileParam,
  UserBasicDto,
  UserInfoDto,
} from "./user.dto.ts";
import { array, enumType, optional, stringMatch } from "@asla/wokao";
import { Controller, Delete, Get, Patch, PipeInput, Post, ToArguments, Use } from "@asla/hono-decorator";
import { HonoContext } from "@/hono/type.ts";
import { checkValue, checkValueAsync, date } from "@/global/check.ts";
import { autoBody } from "@/global/pipe.ts";
import { identity } from "@/global/auth.ts";
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
import { ENV } from "@/config.ts";
import { deleteFrom, select, update } from "@asla/yoursql";
import { insertIntoValues, v } from "@/sql/utils.ts";

@Use(identity)
@autoBody
@Controller({})
export class UserController {
  constructor() {
    if (!ENV.IS_PROD) {
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
    const platform = bind.platform as Platform;
    const [{ count }] = await select<{ count: number }>("count(*) ::INT")
      .from(user_platform_bind.name)
      .where(`user_id=${v(userId)}`)
      .dataClient(dbPool)
      .queryRows();
    if (count > 5) throw new HttpError(409, { message: "最多绑定5个平台账号" });
    await bindPlatformAccount(userId, platform, bind.pla_uid);
    if (count === 0) {
      await this.syncPlatformAccountFromDb(userId, { platform, pla_uid: bind.pla_uid });
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
    await using db = dbPool.begin("REPEATABLE READ");
    const deleteBind = deleteFrom(user_platform_bind.name).where([
      `platform=${v(bind.platform)}`,
      `pla_uid=${v(bind.pla_uid)}`,
      `user_id=${v(userId)}`,
    ]);
    const count = await db.queryCount(deleteBind);
    if (count === 0) throw new HttpError(409, { message: "未找到绑定" });

    const [reset] = await db.queryRows(
      select<{ count: number }>("count(*)::INT")
        .from(user_platform_bind.name)
        .where(`user_id=${v(userId)}`),
    );

    if (reset.count === 0) {
      const deleteCommentStat = update(user_profile.name)
        .set({ comment_stat_enabled: "FALSE" })
        .where(`user_id=${v(userId)}`);
      const deleteClass = deleteFrom(user_class_bind.name).where([
        `user_id=${v(userId)}`,
        `EXISTS ${select("*")
          .from(dclass.name)
          .where(`parent_class_id=${v(PUBLIC_CLASS_ROOT_ID)} AND id=user_class_bind.class_id`)
          .toSelect()}`,
      ]);
      await db.multipleQuery(deleteCommentStat.toString() + ";" + deleteClass.toString());
    }
    await db.commit();
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
    const platform = bind.platform as Platform;

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
    if (ENV.IS_PROD) {
      const checkServer = getCheckerServer();
      userInfo = await checkServer.checkPlatformUserInfo(platformUseId, userId);
      const [user] = await select({ avatar: true })
        .from(pla_user.name)
        .where(`platform=${v(userInfo.platform)} AND pla_uid=${v(userInfo.pla_uid)}`)
        .limit(1)
        .dataClient(dbPool)
        .queryRows();
      if (user?.avatar) userInfo.avatarPath = `/file/avatar/${user.avatar}`;
    } else {
      userInfo = await getPlatformUserInfo(platform, platformUseId, userId);
    }
    if (!userInfo.pass) throw new HttpError(403, { message: "检测不通过" });

    const [bindInfo] = await select<{
      user_id: number;
      platform: Platform;
      pla_uid: string;
    }>({
      user_id: true,
      platform: true,
      pla_uid: true,
    })
      .from(user_platform_bind.name)
      .where([`platform=${v(platform)}`, `pla_uid=${v(userInfo.pla_uid)}`])
      .limit(1)
      .dataClient(dbPool)
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
  async getUserProfile(userId: number): Promise<UserInfoDto> {
    return getUserProfile(userId);
  }

  @ToArguments(async function (ctx: HonoContext) {
    const jwtInfo = await ctx.get("userInfo").getJwtInfo();
    const body = await checkValueAsync(ctx.req.json(), {
      primary_class_id: optional("number", "nullish"),
      notice_setting: optional({ live: optional.boolean }),
      comment_stat_enabled: optional.boolean,
      acquaintance_time: optional(date, "nullish"),
    });
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
    {
      const profileUpdate: Omit<DbUserProfileCreate, "user_id"> = {};
      let updateProfile = false;
      if (notice_setting) {
        if (notice_setting.live !== undefined) {
          updateProfile = true;
          profileUpdate.live_notice = notice_setting.live;
        }
      }
      if (body.acquaintance_time !== undefined) {
        updateProfile = true;
        profileUpdate.acquaintance_time = body.acquaintance_time ? new Date(body.acquaintance_time) : null;
      }
      if (body.comment_stat_enabled !== undefined) {
        updateProfile = true;
        profileUpdate.comment_stat_enabled = body.comment_stat_enabled;
      }
      if (updateProfile) {
        const sql = insertIntoValues(user_profile.name, { user_id: userId, ...profileUpdate })
          .onConflict("user_id")
          .doUpdate("SET " + updateSet(profileUpdate));

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
    if (ENV.IS_PROD) {
      if (param.platform === Platform.douYin) {
        const [info] = await select<{ sec_uid: string }>({ sec_uid: "(extra->>'sec_uid')" })
          .from(pla_user.name)
          .where(`platform=${v(param.platform)} AND pla_uid=${v(param.pla_uid)}`)
          .dataClient(dbPool)
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
    const targetData = select({
      user_id: "bind.user_id",
      platform: "p_u.platform",
      pla_uid: "p_u.pla_uid",
      user_name: "p_u.user_name",
      avatar: "p_u.avatar",
    })
      .from(user_platform_bind.name, { as: "bind" })
      .innerJoin(pla_user.name, { as: "p_u", on: [`bind.platform=p_u.platform`, `bind.pla_uid=p_u.pla_uid`] })
      .where([`bind.platform=${v(param.platform)}`, `bind.pla_uid=${v(param.pla_uid)}`, `bind.user_id=${v(userId)}`]);

    const sql = await update(user.name)
      .set({
        avatar: "target.avatar",
        nickname: "target.user_name",
      })
      .from(targetData.toSelect(), "target")
      .where("public.user.id=target.user_id");
    const count = await sql.client(dbPool).queryCount();
    if (count === 0) throw new HttpError(403, { message: "账号不存在" });
    if (count !== 1) throw new Error("修改超过一个账号" + sql.genSql());
  }
}
function updateSet(obj: Record<string, any>) {
  const keys = Object.keys(obj);
  const set: string[] = [];
  for (const key of keys) {
    if (obj[key] !== undefined) {
      set.push(`${key}=${v(obj[key])}`);
    }
  }
  return set.join(",");
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
  const [res] = await select<{
    platform: Platform;
    pla_uid: string;
    signature: string;
    avatar: string;
    user_name: string;
  }>({
    pla_uid: true,
    signature: true,
    avatar: true,
    user_name: true,
    platform: true,
  })
    .from(pla_user.name)
    .where(where)
    .limit(1)
    .dataClient(dbPool)
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
