import { dbPool } from "@/db/client.ts";
import { v } from "@/sql/utils.ts";

export async function deleteQuestion(questionId: number, userId: number) {
  await using t = dbPool.begin();
  const sql_deleteQuestion = v.gen`UPDATE question SET user_id = null WHERE id=${questionId} AND user_id=${userId}`;
  const count = await t.queryCount(sql_deleteQuestion);
  if (count) {
    const sql_updateCount = v.gen`UPDATE user_profile SET exam_question_count = exam_question_count - 1 WHERE user_id=${userId}`;
    await t.execute(sql_updateCount);
  }
  return count;
}
