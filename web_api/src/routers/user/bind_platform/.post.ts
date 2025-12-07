import routeGroup from "../_route.ts";
import { enumPlatform, Platform, user_platform_bind } from "@ijia/data/db";
import { dbPool } from "@/db/client.ts";
import { enumType } from "@asla/wokao";
import { checkValueAsync } from "@/global/check.ts";
import { HttpError } from "@/global/errors.ts";
import { bindPlatformAccount } from "../-sql/user.service.ts";
import { select } from "@asla/yoursql";
import { v } from "@/sql/utils.ts";
import { syncPlatformAccountFromDb } from "../-sql/syncPlatformAccount.sql.ts";

export default routeGroup.create({
  method: "POST",
  routePath: "/user/bind_platform",
  async validateInput(ctx) {
    const { userId } = await ctx.get("userInfo").getJwtInfo();
    const value = await checkValueAsync(ctx.req.json(), {
      account: {
        platform: enumType(Array.from(enumPlatform)),
        pla_uid: "string",
      },
    });

    return { userId: +userId, account: value.account };
  },
  async handler({ userId, account: bind }) {
    if (bind.platform !== Platform.douYin) throw new HttpError(409, { message: "暂不支持绑定该平台" });
    const platform = bind.platform as Platform;
    const { count } = await dbPool.queryFirstRow(
      select<{ count: number }>("count(*) ::INT")
        .from(user_platform_bind.name)
        .where(`user_id=${v(userId)}`),
    );
    if (count > 5) throw new HttpError(409, { message: "最多绑定5个平台账号" });
    await bindPlatformAccount(userId, platform, bind.pla_uid);
    if (count === 0) {
      await syncPlatformAccountFromDb(userId, { platform, pla_uid: bind.pla_uid });
    }
  },
});
