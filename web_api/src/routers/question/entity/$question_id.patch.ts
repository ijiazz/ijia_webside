import { checkValue, queryInt } from "@/global/check.ts";
import routeGroup from "../_route.ts";
import { updateQuestion } from "../_sql/question.sql.ts";

export default routeGroup.create({
  method: "PATCH",
  routePath: "/question/entity/:question_id",
  async validateInput(ctx) {
    const userId = await ctx.get("userInfo").getUserId();
    const questionId = checkValue(ctx.req.param("question_id"), queryInt);
    const body = await ctx.req.json();
    return { userId, questionId, body };
  },
  async handler({ userId, questionId, body }) {
    return updateQuestion(questionId, userId, body);
  },
});
