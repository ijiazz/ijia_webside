import { dbPool } from "@/db/client.ts";
import { v } from "@/sql/utils.ts";

export async function deleteExamination(examId: number, userId: number) {
  await using t = dbPool.begin();

  const rows = await t.queryRows<{ template_id: number | null }>(
    v.gen`DELETE FROM examination WHERE id=${examId} AND user_id=${userId} RETURNING template_id`,
  );
  if (rows.length === 0) {
    return 0;
  }

  const templateId = rows[0].template_id;
  if (templateId) {
    const sql = v.gen`DELETE FROM exam_paper_template
    WHERE id=${templateId} AND NOT EXISTS (SELECT 1 FROM examination WHERE template_id=${templateId})`;
    await t.query(sql);
  }

  await t.commit();
  return rows.length;
}
