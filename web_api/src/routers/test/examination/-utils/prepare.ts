import { dbPool } from "@/db/client.ts";
import { ExamQuestionType } from "@/dto.ts";
import { insertIntoValues } from "@/sql/utils.ts";
import type { TemplateQuestionInput } from "@ijia/api-types/test";
import type { DbExamPaperTemplateQuestion, DbExamQuestion, DbExamQuestionOption } from "@ijia/school-db/db";

export async function createReviewedQuestions(questions: Partial<DbExamQuestion>[]): Promise<number[]> {
  const values = insertIntoValues("exam_question", questions).returning<{
    id: number;
    question_type: ExamQuestionType;
  }>(["id", "question_type"]);
  const result = await dbPool.queryRows(values);
  const idList = result.map((item) => item.id);

  const options = result.map((item): Partial<DbExamQuestionOption>[] => {
    const options: Partial<DbExamQuestionOption>[] = [];
    switch (item.question_type) {
      case ExamQuestionType.SingleChoice:
      case ExamQuestionType.MultipleChoice:
        options.push(
          { index: 0, text: "选项-0", question_id: item.id },
          { index: 1, text: "选项-1", question_id: item.id },
          { index: 2, text: "选项-2", question_id: item.id },
          { index: 3, text: "选项-3", question_id: item.id },
        );
        break;
      case ExamQuestionType.TrueOrFalse:
        options.push(
          { index: 0, text: "选项-0", question_id: item.id },
          { index: 1, text: "选项-1", question_id: item.id },
        );
        break;
      default:
        break;
    }
    return options;
  });
  await dbPool.execute(insertIntoValues("exam_question_option", options.flat()));
  return idList;
}

export async function prepareExaminationTemplate(
  questions: TemplateQuestionInput[],
  options: { ownerId?: number } = {},
) {
  const { ownerId = null } = options;
  let questionIds: number[] = [];
  if (questions.length) {
    questionIds = await createReviewedQuestions(
      questions.map(({ score, option_map, time_limit, options, ...item }, index) => ({
        question_text: `考试题目-${index}`,
        ...item,
      })),
    );
  }

  const { id: templateId } = await dbPool.queryFirstRow<{ id: number }>(
    insertIntoValues("exam_paper_template", {
      question_total: questions.length,
      owner_id: ownerId,
    }).returning(["id"]),
  );
  if (questionIds.length) {
    await dbPool.execute(
      insertIntoValues(
        "exam_paper_template_question",
        questionIds.map(
          (id, index): Partial<DbExamPaperTemplateQuestion> => ({
            index,
            paper_template_id: templateId,
            question_id: id,
            time_limit: questions[index].time_limit,
            score: questions[index].score ?? 1,
            option_map: questions[index].option_map,
          }),
        ),
      ),
    );
  }

  return { templateId, questionIds };
}
