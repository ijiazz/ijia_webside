import { PUBLIC_CLASS_ROOT_ID } from "@ijia/data/db";
import { dbPool } from "@/db/client.ts";
import { checkValueAsync } from "@/global/check.ts";
import { HttpError } from "@/global/errors.ts";
import { deleteFrom, select, update } from "@asla/yoursql";
import { v } from "@/sql/utils.ts";
import routeGroup from "../_route.ts";

export default routeGroup.create({
  method: "DELETE",
  routePath: "/user/bind_platform",
  async validateInput(ctx) {
    const { userId } = await ctx.get("userInfo").getJwtInfo();
    const param = await checkValueAsync(ctx.req.json(), { bindKey: "string" });
    return { userId, key: param.bindKey };
  },
  async handler({ userId, key }) {
    const [platform, pla_uid] = key.split("-");
    const bind = {
      platform,
      pla_uid,
    };
    await using db = dbPool.begin("REPEATABLE READ");
    const deleteBind = deleteFrom("user_platform_bind").where([
      `platform=${v(bind.platform)}`,
      `pla_uid=${v(bind.pla_uid)}`,
      `user_id=${v(userId)}`,
    ]);
    const count = await db.queryCount(deleteBind);
    if (count === 0) throw new HttpError(409, { message: "未找到绑定" });

    const [reset] = await db.queryRows(
      select<{ count: number }>("count(*)::INT")
        .from("user_platform_bind")
        .where(`user_id=${v(userId)}`),
    );

    if (reset.count === 0) {
      const deleteCommentStat = update("user_profile")
        .set({ comment_stat_enabled: "FALSE" })
        .where(`user_id=${v(userId)}`);
      const deleteClass = deleteFrom("user_class_bind").where([
        `user_id=${v(userId)}`,
        `EXISTS ${select("*")
          .from("class")
          .where(`parent_class_id=${v(PUBLIC_CLASS_ROOT_ID)} AND id=user_class_bind.class_id`)
          .toSelect()}`,
      ]);
      await db.execute([deleteCommentStat, deleteClass]);
    }
    await db.commit();
  },
});
