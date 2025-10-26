import v, { SqlStatementDataset } from "@ijia/data/yoursql";
import { post, user } from "@ijia/data/db";
import { BulletChat } from "../live.dto.ts";
import { jsonb_build_object } from "@/global/sql_util.ts";

type GetBulletChartOptions = {
  groupId: number | null;
  pageSize: number;
  page: number;
};
export function genGetBulletChart(options: GetBulletChartOptions): SqlStatementDataset<BulletChat> {
  const { groupId, pageSize, page } = options;
  const sql = post
    .fromAs("p")
    .innerJoin(user, "u", "p.user_id = u.id")
    .select<BulletChat>({
      text: "p.content_text",
      id: "p.id",
      like_count: "p.like_count",
      user: jsonb_build_object({
        user_name: "u.nickname",
        user_id: "u.id ::TEXT",
        avatar_url: "'/file/avatar/'||u.avatar",
      }),
    })
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
  return sql;
}
