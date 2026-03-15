import routeGroup from "../_route.ts";
import { createQuestion } from "../_sql/create_question.sql.ts";
import { checkValueAsync } from "@/global/check.ts";
import { CREATE_QUESTION_PARAM_SCHEMA } from "../_utils/create.schema.ts";

export default routeGroup.create({
  method: "PUT",
  routePath: "/question/entity",
  async validateInput(ctx) {
    const userId = await ctx.get("userInfo").getUserId();
    const body = await checkValueAsync(ctx.req.json(), CREATE_QUESTION_PARAM_SCHEMA);

    return { userId, body };
  },
  async handler({ userId, body }) {
    const questionId = await createQuestion(userId, body);
    return { question_id: questionId };
  },
});
