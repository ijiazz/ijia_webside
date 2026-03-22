import { dbPool } from "@/db/client.ts";
import { v } from "@asla/yoursql";

export async function getQuestionPublicStats() {
  const sql = v.gen`SELECT
      COUNT(*) FILTER (WHERE review_status='pending'::review_status AND NOT is_system_gen)::INT AS reviewing_count,
      COUNT(*) FILTER (WHERE NOT is_system_gen)::INT AS total_count
    FROM exam_question`;
  const row = await dbPool.queryFirstRow<{ reviewing_count: number; total_count: number }>(sql);
  return row;
}
