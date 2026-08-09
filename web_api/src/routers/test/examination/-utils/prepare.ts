import { dbPool } from "@/db/client.ts";
import { ExamQuestionType } from "@/dto.ts";
import { insertIntoValues } from "@/sql/utils.ts";
import type { TemplateQuestionInput } from "@ijia/api-types/test";
import { DbExamPaperTemplateQuestion, ReviewStatus } from "@ijia/school-db/db";
import { createQuestion } from "@/routers/question/mod.ts";

/** 生成题目选项，选项数量不小于最大的答案索引 */
function genOptions(answerIndex: number[], type: ExamQuestionType) {
  const maxIndex = Math.max(type === ExamQuestionType.TrueOrFalse ? 1 : 3, ...answerIndex) + 1;
  const options: { index: number; text: string }[] = [];
  for (let i = 0; i < maxIndex; i++) {
    options.push({ index: i, text: `选项-${i}` });
  }
  return options;
}
export async function prepareExaminationTemplate(
  questions: TemplateQuestionInput[],
  options: { ownerId?: number } = {},
) {
  const { ownerId = null } = options;
  let questionIds: number[] = [];
  for (let i = 0; i < questions.length; i++) {
    const item = questions[i];
    const options = item.options ?? genOptions(item.answer_index, item.question_type);

    const qId = await createQuestion(
      {
        user_id: item.user_id,
        question_text: `考试题目-${i}`,
        question_type: item.question_type,
        answer_index: item.answer_index ?? [0],
        review_status: ReviewStatus.passed,
        answer_text: item.answer_text,
        difficulty_level: item.difficulty_level,
      },
      { options },
    );
    questionIds[i] = qId;
  }

  const { id: templateId } = await dbPool.queryFirstRow<{ id: number }>(
    insertIntoValues("exam_paper_template", {
      question_total: questions.length,
      owner_id: ownerId,
    }).returning(["id"]),
  );
  if (questionIds.length) {
    const templateQuestion = questionIds.map((id, index): Partial<DbExamPaperTemplateQuestion> => {
      const question = questions[index];
      const score = question.score;
      return {
        index,
        paper_template_id: templateId,
        question_id: id,
        time_limit: question.time_limit,
        score: score ?? (question.question_type === ExamQuestionType.MultipleChoice ? 2 : 1),
        option_map: question.option_map,
      };
    });
    await dbPool.execute(insertIntoValues("exam_paper_template_question", templateQuestion));
  }

  return { templateId, questionIds };
}
