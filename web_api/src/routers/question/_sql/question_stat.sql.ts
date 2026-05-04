import { dbPool } from "@/db/client.ts";
import { v } from "@asla/yoursql";

export async function getQuestionPublicStats() {
  const sql = v.gen`SELECT
      COUNT(*) FILTER (WHERE review_status='pending'::review_status AND NOT is_system_gen)::INT AS reviewing_count,
      COUNT(*) FILTER (WHERE review_status='passed'::review_status AND NOT is_system_gen)::INT AS passed_count
    FROM exam_question`;
  const row = await dbPool.queryFirstRow<{ reviewing_count: number; passed_count: number }>(sql);
  return row;
}
