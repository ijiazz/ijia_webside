import { GetListOption } from "@/dto/common.ts";
import { pla_user, user, user_platform_bind } from "@ijia/data/db";
import { dbPool } from "@ijia/data/dbclient";
import { UserAvatarDto } from "../../../dto/live.ts";
import { select } from "@asla/yoursql";

/** 获取所有用户的头像 */
export async function genScreenAvatar(limit: number): Promise<UserAvatarDto[]> {
  if (!limit) throw new Error("limit is required");
  return select<UserAvatarDto>({
    avatar_url: "'/file/avatar/'||u.avatar",
    id: "u.id",
    name: "u.nickname",
  })
    .from(user.name, { as: "u" })
    .where([
      "u.avatar IS NOT NULL",
      `EXISTS ${select("1").from(user_platform_bind.name, { as: "bind" }).where(`bind.user_id=u.id`).toSelect()}`,
    ])
    .orderBy("RANDOM()")
    .limit(limit)
    .dataClient(dbPool)
    .queryRows();
}
export async function genAllAvatar(option: GetListOption) {
  const { number = 20, offset = 0 } = option;
  const itemsSql = select<UserAvatarDto>({
    avatar_url: "'/file/avatar/'||u.avatar",
    id: "u.platform||u.pla_uid",
    name: "u.user_name",
  })
    .from(pla_user.name, { as: "u" })
    .orderBy("u.pla_uid")
    .limit(number, offset);
  const totalSql = select<{ count: number }>("count(*)::INT").from(pla_user.name);
  const [items, [total]] = await dbPool.multipleQueryRows(itemsSql + ";" + totalSql);

  return {
    items,
    total: total.count,
  };
}
