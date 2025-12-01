import { Platform, pla_user } from "@ijia/data/db";
import { dbPool } from "@ijia/data/dbclient";
import { checkValueAsync } from "@/global/check.ts";
import { HttpError } from "@/global/errors.ts";
import { getCheckerServer } from "@/services/douyin.ts";
import { ENV } from "@/config.ts";
import { select } from "@asla/yoursql";
import { v } from "@/sql/utils.ts";
import routeGroup from "../_route.ts";
import { syncPlatformAccountFromDb } from "../-sql/syncPlatformAccount.sql.ts";

export default routeGroup.create({
  method: "POST",
  routePath: "/user/profile/sync",
  async validateInput(ctx) {
    const jwtInfo = await ctx.get("userInfo").getJwtInfo();
    const param = await checkValueAsync(ctx.req.json(), {
      bindKey: "string",
    });
    const [platform, pla_uid] = param.bindKey.split("-");

    return { userId: +jwtInfo.userId, platform: platform as Platform, pla_uid };
  },
  async handler({ userId, platform, pla_uid }) {
    if (ENV.IS_PROD) {
      if (platform === Platform.douYin) {
        const [info] = await select<{ sec_uid: string }>({ sec_uid: "(extra->>'sec_uid')" })
          .from(pla_user.name)
          .where(`platform=${v(platform)} AND pla_uid=${v(pla_uid)}`)
          .dataClient(dbPool)
          .queryRows();
        if (info) await getCheckerServer().syncUserInfo(platform, info.sec_uid);
        else throw new HttpError(404, { message: "账号不存在" });
      } else {
        await getCheckerServer().syncUserInfo(platform, pla_uid);
      }
    }
    await syncPlatformAccountFromDb(userId, { platform, pla_uid });
  },
});
