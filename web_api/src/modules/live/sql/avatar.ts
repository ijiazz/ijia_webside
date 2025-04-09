import { GetListOption } from "@/api.ts";
import { pla_user, user, user_platform_bind } from "@ijia/data/db";
import { dbPool } from "@ijia/data/yoursql";
import { UserAvatar } from "../live.dto.ts";
import { ListDto } from "@/modules/dto_common.ts";
import fs from "node:fs/promises";

export async function getDirFile(dir: string): Promise<ListDto<UserAvatar>> {
  const list = await fs.readdir(dir);

  return {
    items: list.map((fileName) => ({
      avatar_url: fileName,
      id: fileName,
      name: fileName,
    })),
    total: list.length,
  };
}

/** 获取所有用户的头像 */
export async function genScreenAvatar(limit: number): Promise<UserAvatar[]> {
  if (!limit) throw new Error("limit is required");
  return user
    .fromAs("u")
    .select<UserAvatar>({
      avatar_url: "'/file/avatar/'||u.avatar",
      id: "u.id",
      name: "u.nickname",
    })
    .where([
      "u.avatar IS NOT NULL",
      `EXISTS ${user_platform_bind.fromAs("bind").select("1").where(`bind.user_id=u.id`).toSelect()}`,
    ])
    .orderBy("RANDOM()")
    .limit(limit)
    .queryRows();
}
export async function genAllAvatar(option: GetListOption) {
  const { number = 20, offset = 0 } = option;
  const itemsSql = pla_user
    .fromAs("u")
    .select<UserAvatar>({
      avatar_url: "'/file/avatar/'||u.avatar",
      id: "u.platform||u.pla_uid",
      name: "u.user_name",
    })
    .orderBy("u.pla_uid")
    .limit(number, offset);
  const totalSql = pla_user.select<{ count: number }>("count(*)::INT");
  const [items, [total]] = await dbPool.multipleQueryRows(itemsSql + ";" + totalSql);

  return {
    items,
    total: total.count,
  };
}
