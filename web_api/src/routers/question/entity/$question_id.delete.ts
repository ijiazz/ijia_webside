import { checkValue, queryInt } from "@/global/check.ts";
import routeGroup from "../_route.ts";
import { deleteQuestion } from "../_sql/question_delete.sql.ts";

export default routeGroup.create({
  method: "DELETE",
  routePath: "/question/entity/:question_id",
  async validateInput(ctx) {
    const userId = await ctx.get("userInfo").getUserId();
    const questionId = checkValue(ctx.req.param("question_id"), queryInt);
    return { userId, questionId };
  },
  async handler({ userId, questionId }) {
    return deleteQuestion(questionId, userId);
  },
});
