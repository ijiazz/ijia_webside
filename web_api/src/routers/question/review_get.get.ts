import { checkValue, queryInt } from "@/global/check.ts";
import routeGroup from "./_route.ts";
import { requiredLogin, requiredRoles, Role } from "@/middleware/auth.ts";
import { GetUserQuestionResult } from "@/dto.ts";
import { HttpError } from "@/global/errors.ts";
import { getQuestionDetailForReview } from "./_sql/question_get.sql.ts";
import { getQuestionIdFromReviewId } from "./_sql/review_get.sql.ts";

export default routeGroup.create({
  method: "GET",
  routePath: "/question/review_get/:review_id",
  middlewares: [requiredLogin, requiredRoles(Role.Admin)],
  async validateInput(ctx) {
    const reviewId = checkValue(ctx.req.param("review_id"), queryInt);
    return { reviewId };
  },
  async handler({ reviewId }): Promise<GetUserQuestionResult> {
    const questionId = await getQuestionIdFromReviewId(reviewId);
    if (!questionId) {
      throw new HttpError(400, "题目不存在，或没有权限");
    }
    const question = await getQuestionDetailForReview(questionId);
    if (!question) {
      throw new HttpError(400, "题目不存在，或没有权限");
    }
    return { item: question };
  },
});
