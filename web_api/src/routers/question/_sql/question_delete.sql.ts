import { dbPool } from "@/db/client.ts";
import { ReviewStatus } from "@/dto.ts";
import { v } from "@/sql/utils.ts";

export async function deleteQuestion(questionId: number, userId: number) {
  await using t = dbPool.begin();
  const sql_deleteQuestion = v.gen`UPDATE exam_question SET user_id = null WHERE id=${questionId} AND user_id=${userId} RETURNING review_status, review_id`;
  const res = await t.queryRows<{ review_status: ReviewStatus; review_id: number }>(sql_deleteQuestion);
  const count = res.length;
  if (count === 0) {
    return 0;
  }
  if (count !== 1) {
    throw new Error("删除失败");
  }
  const item = res[0];
  if (item.review_status === ReviewStatus.rejected) {
    await t.query([
      v.gen`DELETE FROM exam_question WHERE id=${questionId}`,
      v.gen`DELETE FROM review WHERE id=${item.review_id}`,
    ]);
  }

  const sql_updateCount = v.gen`UPDATE user_profile SET exam_question_count = exam_question_count - ${count} WHERE user_id=${userId}`;
  await t.execute(sql_updateCount);
  await t.commit();

  return count;
}
