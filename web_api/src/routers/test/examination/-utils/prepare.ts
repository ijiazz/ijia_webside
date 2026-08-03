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

  const questionOptions = result.flatMap((item) => getDefaultQuestionOptions(item.question_type, item.id));
  if (questionOptions.length) await dbPool.execute(insertIntoValues("exam_question_option", questionOptions));
  return idList;
}

function getDefaultQuestionOptions(
  questionType: ExamQuestionType,
  questionId: number,
): Partial<DbExamQuestionOption>[] {
  switch (questionType) {
    case ExamQuestionType.SingleChoice:
    case ExamQuestionType.MultipleChoice:
      return [
        { index: 0, text: "选项-0", question_id: questionId },
        { index: 1, text: "选项-1", question_id: questionId },
        { index: 2, text: "选项-2", question_id: questionId },
        { index: 3, text: "选项-3", question_id: questionId },
      ];
    case ExamQuestionType.TrueOrFalse:
      return [
        { index: 0, text: "选项-0", question_id: questionId },
        { index: 1, text: "选项-1", question_id: questionId },
      ];
    default:
      return [];
  }
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
