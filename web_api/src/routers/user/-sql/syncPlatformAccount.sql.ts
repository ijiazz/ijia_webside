import { Platform, pla_user, user_platform_bind, user } from "@ijia/data/db";
import { dbPool } from "@/db/client.ts";
import { HttpError } from "@/global/errors.ts";
import { select, update } from "@asla/yoursql";
import { v } from "@/sql/utils.ts";

export async function syncPlatformAccountFromDb(userId: number, param: { platform: Platform; pla_uid: string }) {
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
    .from(targetData.toSelect("target"))
    .where("public.user.id=target.user_id");
  const count = await dbPool.queryCount(sql);
  if (count === 0) throw new HttpError(403, { message: "账号不存在" });
  if (count !== 1) throw new Error("修改超过一个账号" + sql.genSql());
}
