import routeGroup from "../../../_route.ts";
import { requiredRoles, Role } from "@/middleware/auth.ts";
import { commitQuestionReview } from "../../../_sql/question.sql.ts";
import { checkValue, queryInt } from "@/global/check.ts";

export default routeGroup.create({
  method: "POST",
  routePath: "/question/review/entity/:review_id/commit",
  middlewares: [requiredRoles(Role.Admin)],
  async validateInput(ctx) {
    const reviewId = checkValue(ctx.req.param("review_id"), queryInt);
    const reviewerId = await ctx.get("userInfo").getUserId();
    const body = await ctx.req.json();
    return { reviewId, reviewerId, body };
  },
  async handler({ reviewId, reviewerId, body }) {
    return commitQuestionReview(reviewId, reviewerId, body);
  },
});
