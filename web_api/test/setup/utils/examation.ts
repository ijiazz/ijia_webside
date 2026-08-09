import { createQuestion } from "@/routers/question/mod.ts";
import { ReviewStatus, ExamQuestionType } from "@ijia/school-db/db";

export async function preparePassedQuestions(count: number) {
  const ids: number[] = [];
  for (let i = 0; i < count; i++) {
    ids[i] = await createQuestion(
      {
        question_text: `考试题目-${i}`,
        question_type: ExamQuestionType.SingleChoice,
        answer_index: [0],
        review_status: ReviewStatus.passed,
      },
      {
        options: [{ text: "选项-0" }, { text: "选项-1" }, { text: "选项-2" }, { text: "选项-3" }],
      },
    );
  }

  return ids;
}
