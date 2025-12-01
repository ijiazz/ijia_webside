import { enumPlatform, Platform, pla_user, user_platform_bind } from "@ijia/data/db";
import { dbPool } from "@ijia/data/dbclient";
import { array, enumType, optional, stringMatch } from "@asla/wokao";
import { checkValueAsync } from "@/global/check.ts";
import { HttpError } from "@/global/errors.ts";
import { getCheckerServer, getUerSecIdFromShareUrl, PlatformUserBasicInfoCheckResult } from "@/services/douyin.ts";
import { toErrorStr } from "evlib";
import { ENV } from "@/config.ts";
import { select } from "@asla/yoursql";
import { v } from "@/sql/utils.ts";
import routeGroup from "../_route.ts";
import { getPlatformUserInfo } from "../-sql/getPlatformUserInfo.sql.ts";

export default routeGroup.create({
  method: "POST",
  routePath: "/user/bind_platform/check",
  async validateInput(ctx) {
    const { userId } = await ctx.get("userInfo").getJwtInfo();
    const param = await checkValueAsync(ctx.req.json(), {
      platformList: array({
        platform: enumType(Array.from(enumPlatform)),
        userHomeLink: optional(stringMatch(/https?:\/\/.+/)),
        platformUseId: optional.string,
      }),
    });
    return { userId: +userId, param };
  },
  async handler({ userId, param: body }) {
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
  },
});
