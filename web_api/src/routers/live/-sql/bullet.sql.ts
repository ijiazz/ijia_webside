import { BulletChat } from "@/dto.ts";
import { jsonb_build_object } from "@/global/sql_util.ts";
import { select } from "@asla/yoursql";
import { v } from "@/sql/utils.ts";
import { dbPool } from "@/db/client.ts";
import { ExecutableSQL } from "@asla/pg";

type GetBulletChartOptions = {
  groupId: number | null;
  pageSize: number;
  page: number;
};
export function genGetBulletChart(options: GetBulletChartOptions): ExecutableSQL<BulletChat[]> {
  const { groupId, pageSize, page } = options;
  const sql = select<BulletChat>({
    text: "p.content_text",
    id: "p.id",
    like_count: "p.like_count",
    user: jsonb_build_object({
      user_name: "u.nickname",
      user_id: "u.id ::TEXT",
      avatar_url: "'/file/avatar/'||u.avatar",
    }),
  })
    .from("public.post", { as: "p" })
    .innerJoin("public.user", { as: "u", on: "p.user_id = u.id" })
    .where(() => {
      const conditions: string[] = [
        `NOT p.is_delete`,
        "NOT p.is_hide",
        "p.publish_time IS NOT NULL",
        "p.is_review_pass=TRUE",
        "p.is_reviewing=FALSE",
      ];
      if (groupId !== null) {
        conditions.push(`p.group_id=${v(groupId)}`);
      }
      return conditions;
    })
    .orderBy("p.like_count DESC, p.id ASC")
    .limit(pageSize, page * pageSize);
  return dbPool.createQueryableSQL(sql, (pool, s) => pool.queryRows(s));
}
