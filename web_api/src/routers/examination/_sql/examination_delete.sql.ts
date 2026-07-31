import { HttpError } from "@/common/errors.ts";
import { dbPool } from "@/db/client.ts";
import { v } from "@/sql/utils.ts";

export async function deleteExamination(examId: number, userId: number) {
  await using t = dbPool.begin("REPEATABLE READ");
  const [result] = await t.queryRows<{ template_id: number }>(
    v.gen`DELETE FROM examination WHERE id=${examId} AND user_id=${userId} RETURNING template_id`,
  );
  if (!result) return 0;
  const templateId = result.template_id;

  const { owner_id, exam_number } = await t.queryFirstRow<{ owner_id: number | null; exam_number: number }>(
    v.gen`UPDATE exam_paper_template SET exam_number=exam_number-1 WHERE id=${templateId} RETURNING owner_id, exam_number`,
  );
  if (owner_id !== userId) throw new HttpError(403, "没有权限删除");

  if (exam_number === 0) {
    const needDeleteQuestion = v.gen`
      SELECT q.id
        FROM exam_paper_template_question AS qb
        INNER JOIN exam_question AS q ON qb.question_id=q.id
        WHERE q.is_system_gen AND qb.paper_template_id=${templateId}
      `;
    await t.execute([
      v.gen`DELETE FROM exam_question WHERE id=${templateId} AND id IN (${new String(needDeleteQuestion)})`,
      v.gen`DELETE FROM exam_paper_template WHERE id=${templateId}`,
    ]);
  }
  await t.commit();
  return 1;
}
