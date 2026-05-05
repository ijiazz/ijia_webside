import { checkValue, queryInt } from "@/global/check.ts";
import routeGroup from "../_route.ts";
import { updateQuestion } from "../_sql/question_update.sql.ts";
import { checkValueAsync } from "@/global/schema.ts";
import { UPDATE_QUESTION_PARAM_SCHEMA } from "../_utils/update.schema.ts";

export default routeGroup.create({
  method: "PATCH",
  routePath: "/question/entity/:question_id",
  async validateInput(ctx) {
    const questionId = checkValue(ctx.req.param("question_id"), queryInt);
    const userId = await ctx.get("userInfo").getUserId();
    const body = await checkValueAsync(ctx.req.json(), UPDATE_QUESTION_PARAM_SCHEMA);
    return { userId, questionId, body };
  },
  async handler({ userId, questionId, body }) {
    await updateQuestion(questionId, userId, body);
  },
});
