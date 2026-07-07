import { dbPool } from "@/db/client.ts";
import { insertIntoValues } from "@/sql/utils.ts";
import { DbExamPaperTemplateQuestion, DbExamQuestion, DbExamQuestionOption, ReviewStatus } from "@ijia/school-db/db";
import { ExamQuestionType } from "@/dto.ts";
import {
  createEmptyExamination,
  createExaminationByQuestionTotal,
  createExaminationByTemplate,
  CreateExaminationOption,
} from "@/routers/examination/mod.ts";

async function crateReviewedQuestions(questions: Partial<DbExamQuestion>[]): Promise<number[]> {
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
export async function preparePassedQuestions(count: number, userId: number) {
  const questions = new Array(count).fill(0).map(
    (item, index): Partial<DbExamQuestion> => ({
      user_id: userId,
      question_text: `考试题目-${index}`,
      question_type: ExamQuestionType.SingleChoice,
      answer_index: [0],
      review_status: ReviewStatus.passed,
    }),
  );

  return crateReviewedQuestions(questions);
}
export type TemplateQuestionInput = Pick<DbExamQuestion, "answer_index" | "question_type"> & {
  score?: number;
  option_map?: number[];
  options?: Partial<DbExamQuestionOption>[];
  time_limit?: number;
};
/**
 * 答案为 0、1、2
 */
export const DEFAULT_QUESTIONS: TemplateQuestionInput[] = [
  { answer_index: [0], question_type: ExamQuestionType.SingleChoice },
  { answer_index: [1], question_type: ExamQuestionType.SingleChoice },
  { answer_index: [2], question_type: ExamQuestionType.SingleChoice },
];
export async function prepareExaminationTemplate(questions: TemplateQuestionInput[]) {
  let questionIds: number[] = [];
  if (questions.length) {
    questionIds = await crateReviewedQuestions(
      questions.map(({ score, option_map, time_limit, options, ...item }, index) => ({
        question_text: `考试题目-${index}`,
        ...item,
      })),
    );
  }

  const { id: templateId } = await dbPool.queryFirstRow<{ id: number }>(
    insertIntoValues("exam_paper_template", {
      question_total: questions.length,
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
export async function prepareExamination(
  option: Omit<CreateExaminationOption, "title"> & { title?: string; templateId?: number; questionTotal?: number },
): Promise<number> {
  const { templateId, questionTotal, title = "考试标题", ...rest } = option;
  if (typeof templateId === "number") {
    const id = await createExaminationByTemplate(templateId, { title, ...rest });
    if (typeof id !== "number") throw new Error("Failed to create examination by template");
    return id;
  } else if (typeof questionTotal === "number") {
    const id = await createExaminationByQuestionTotal({ title, ...rest }, { questions: { number: questionTotal } });
    if (typeof id !== "number") throw new Error("Failed to create examination by question total");
    return id;
  } else {
    return createEmptyExamination({ title, ...rest });
  }
}
