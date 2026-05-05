import { checkValue, queryInt } from "@/global/check.ts";
import routeGroup from "../_route.ts";
import { deleteQuestion } from "../_sql/question_delete.sql.ts";
import { HttpError } from "@/global/errors.ts";

export default routeGroup.create({
  method: "DELETE",
  routePath: "/question/entity/:question_id",
  async validateInput(ctx) {
    const userId = await ctx.get("userInfo").getUserId();
    const questionId = checkValue(ctx.req.param("question_id"), queryInt);
    return { userId, questionId };
  },
  async handler({ userId, questionId }) {
    const count = await deleteQuestion(questionId, userId);
    if (!count) {
      throw new HttpError(400, "删除失败，可能题目不存在或者没有权限");
    }
  },
});
