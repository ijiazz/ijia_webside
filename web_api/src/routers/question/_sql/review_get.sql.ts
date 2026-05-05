import { dbPool } from "@/db/client.ts";
import { v } from "@/sql/utils.ts";

export async function getQuestionIdFromReviewId(reviewId: number): Promise<number | null> {
  const sql = v.gen`SELECT (info->>'target_id')::INT AS question_id FROM review
    WHERE target_type = 'question' AND id = ${v(reviewId)} AND is_reviewing
    LIMIT 1`;
  const res = await dbPool.queryRows<{ question_id: number }>(sql);
  if (res.length === 0) {
    return null;
  }
  return res[0].question_id;
}
