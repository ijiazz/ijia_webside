import { dbPool } from "@/db/client.ts";
import { v } from "@/sql/utils.ts";

export async function deleteExamination(examId: number, userId: number) {
  const sql = v.gen`WITH deleted_exams AS (
    DELETE FROM examination WHERE id=${examId} AND user_id=${userId} RETURNING template_id
  ), deleted_templates AS (
    DELETE FROM exam_paper_template WHERE id = (SELECT template_id FROM deleted_exams) AND owner_id IS NULL AND exam_number=0
  )
  SELECT COUNT(*)::INT AS deleted_count FROM deleted_exams;`;
  const { deleted_count } = await dbPool.queryFirstRow<{ deleted_count: number }>(sql);
  return deleted_count;
}
