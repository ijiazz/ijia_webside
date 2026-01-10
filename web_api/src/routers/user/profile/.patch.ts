import { DbUserProfileCreate } from "@ijia/data/db";
import { dbPool } from "@/db/client.ts";
import { optional } from "@asla/wokao";
import { checkValue, checkValueAsync, date } from "@/global/check.ts";
import { HttpError } from "@/global/errors.ts";
import { deletePublicClassOfUser, setUserPublicClass } from "../-sql/user.service.ts";
import { insertIntoValues, v } from "@/sql/utils.ts";
import routeGroup from "../_route.ts";

export default routeGroup.create({
  method: "PATCH",
  routePath: "/user/profile",
  async validateInput(ctx) {
    const jwtInfo = await ctx.get("userInfo").getJwtInfo();
    const body = await checkValueAsync(ctx.req.json(), {
      primary_class_id: optional("number", "nullish"),
      notice_setting: optional({ live: optional.boolean }),
      comment_stat_enabled: optional.boolean,
      acquaintance_time: optional(date, "nullish"),
    });
    return { userId: +jwtInfo.userId, body };
  },
  async handler({ userId, body }) {
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
        const sql = insertIntoValues("user_profile", { user_id: userId, ...profileUpdate })
          .onConflict("user_id")
          .doUpdate("SET " + updateSet(profileUpdate));

        await db.queryCount(sql);
      }
    }
    await db.commit();
  },
});
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
