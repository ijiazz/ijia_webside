import { checkValueAsync } from "@/common/check.ts";
import { createRoute } from "@/common/context.ts";
import type { TestExaminationAPI } from "@ijia/api-types/test";
import { ExpectType } from "@asla/wokao";
import { queryInt } from "@/common/check.ts";
import { ExamQuestionType, ReviewStatus } from "@ijia/school-db/db";
import { createQuestion } from "@/routers/question/mod.ts";

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
  const ids: number[] = [];
  for (let i = 0; i < count; i++) {
    ids[i] = await createQuestion(
      {
        user_id: userId,
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
