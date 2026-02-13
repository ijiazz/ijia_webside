import { dbPool } from "@/db/client.ts";
import { select } from "@asla/yoursql";
import { v } from "@/sql/utils.ts";

export async function getUserDateCount(userId: number) {
  const { count } = await dbPool.queryFirstRow(
    select<{ count: number }>({ count: "count(*)::INT" })
      .from("public.post", { as: "p" })
      .where([`user_id=${v(userId)}`, `DATE(p.create_time) = CURRENT_DATE`]),
  );
  return count;
}
