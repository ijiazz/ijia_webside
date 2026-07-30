import { checkValueAsync } from "@/common/check.ts";
import { createRoute } from "@/common/context.ts";
import type { TestExaminationAPI } from "@ijia/api-types/test";
import { ExpectType } from "@asla/wokao";
import { createReviewedQuestions } from "../-utils/prepare.ts";
import { queryInt } from "@/common/check.ts";
import { DbExamQuestion, ExamQuestionType, ReviewStatus } from "@ijia/school-db/db";

type PrepareReviewedBody = TestExaminationAPI["POST /test/question/prepare-reviewed"]["body"];
type PrepareReviewedResponse = TestExaminationAPI["POST /test/question/prepare-reviewed"]["response"];

const PREPARE_BODY_SCHEMA = {
  count: queryInt,
  userId: queryInt,
} satisfies ExpectType;

export default createRoute<PrepareReviewedResponse, PrepareReviewedBody>({
  method: "POST",
  routePath: "/test/question/prepare-reviewed",
  validateInput({ req }) {
    return checkValueAsync(req.json(), PREPARE_BODY_SCHEMA);
  },
  async handler({ count, userId }) {
    const questionIds = await preparePassedQuestions(count, userId);
    return { questionIds };
  },
});

async function preparePassedQuestions(count: number, userId: number) {
  const questions = new Array(count).fill(0).map(
    (item, index): Partial<DbExamQuestion> => ({
      user_id: userId,
      question_text: `考试题目-${index}`,
      question_type: ExamQuestionType.SingleChoice,
      answer_index: [0],
      review_status: ReviewStatus.passed,
    }),
  );

  return createReviewedQuestions(questions);
}
