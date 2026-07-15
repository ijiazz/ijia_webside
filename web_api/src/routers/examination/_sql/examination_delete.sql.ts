import { dbPool } from "@/db/client.ts";
import { v } from "@/sql/utils.ts";

export async function deleteExamination(examId: number, userId: number) {
  await using t = dbPool.begin("REPEATABLE READ")
  const [result] = await t.queryRows<{ template_id: number }>(v.gen`DELETE FROM examination WHERE id=${examId} AND user_id=${userId} RETURNING template_id`);
  if (!result) return 0

  await t.execute(v.gen`UPDATE exam_paper_template SET exam_number=exam_number-1 WHERE id=${result.template_id}`);

  const needDelete = await t.queryCount(v.gen`SELECT exam_number FROM exam_paper_template WHERE id=${result.template_id} AND owner_id=${userId} AND exam_number=0`);
  if (needDelete) {
    const needDeleteQuestion = v.gen`
      SELECT q.id
        FROM exam_paper_template_question AS qb
        INNER JOIN exam_question AS q ON qb.question_id=q.id
        WHERE q.is_system_gen AND qb.paper_template_id=${result.template_id}
      `
    await t.execute([
      v.gen`DELETE FROM exam_question WHERE id=${result.template_id} AND id IN (${new String(needDeleteQuestion)})`,
      v.gen`DELETE FROM exam_paper_template WHERE id=${result.template_id}`
    ]);
  }
  await t.commit();
  return 1;
}
