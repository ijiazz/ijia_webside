import { HttpError } from "@/common/errors.ts";
import { dbPool } from "@/db/client.ts";
import { ExaminationCreateInput } from "@/dto.ts";
import { insertIntoValues, v } from "@/sql/utils.ts";

export async function createExamination(
  input: ExaminationCreateInput,
  option: { title: string; userId: number },
): Promise<number> {
  const { userId, title } = option;
  await using t = dbPool.begin();

  let templateId: number;

  if (typeof input.template_id === "string") {
    const [templateRow] = await t.queryRows<{ id: number }>(
      v.gen`SELECT id FROM exam_paper_template WHERE id=${input.template_id} LIMIT 1`,
    );
    if (!templateRow) {
      throw new HttpError(404, "考试模板不存在");
    }
    templateId = templateRow.id;
  } else {
    const questionTotal = input.question_total;
    if (!Number.isSafeInteger(questionTotal)) throw new HttpError(400, "题目数量必须是整数");
    if (questionTotal < 0) throw new HttpError(400, "题目数量不能小于 0");

    const templateResult = await t.queryRows<{ id: number }>(
      insertIntoValues("exam_paper_template", {
        question_total: questionTotal,
        grade_total: questionTotal,
      }).returning(["id"]),
    );
    templateId = templateResult[0].id;
  }

  const examResult = await t.queryRows<{ id: number }>(
    insertIntoValues("examination", {
      user_id: userId,
      template_id: templateId,
      title,
      allow_time_start: null,
      allow_time_end: null,
      use_time_total_limit: 0,
    }).returning(["id"]),
  );

  await t.commit();
  return examResult[0].id;
}
