import { GetListOption, UserAvatarDto } from "@/dto.ts";
import { dbPool } from "@/db/client.ts";
import { select } from "@asla/yoursql";
import { QueryRowsResult } from "@asla/pg";

/** 获取所有用户的头像 */
export async function genScreenAvatar(limit: number): Promise<UserAvatarDto[]> {
  if (!limit) throw new Error("limit is required");
  return dbPool.queryRows(
    select<UserAvatarDto>({
      avatar_url: "'/file/avatar/'||u.avatar",
      id: "u.id",
      name: "u.nickname",
    })
      .from("public.user", { as: "u" })
      .where([
        "u.avatar IS NOT NULL",
        `EXISTS ${select("1").from("user_platform_bind", { as: "bind" }).where(`bind.user_id=u.id`).toSelect()}`,
      ])
      .orderBy("RANDOM()")
      .limit(limit),
  );
}
export async function genAllAvatar(option: GetListOption) {
  const { number = 20, offset = 0 } = option;
  const itemsSql = select<UserAvatarDto>({
    avatar_url: "'/file/avatar/'||u.avatar",
    id: "u.platform||u.pla_uid",
    name: "u.user_name",
  })
    .from("pla_user", { as: "u" })
    .orderBy("u.pla_uid")
    .limit(number, offset);
  const totalSql = select<{ count: number }>("count(*)::INT").from("pla_user");
  const [items, [total]] = await dbPool
    .query<[QueryRowsResult, QueryRowsResult]>([itemsSql, totalSql])
    .then(([r1, r2]) => [r1.rows, r2.rows]);

  return {
    items,
    total: total.count,
  };
}
