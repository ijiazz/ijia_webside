import { checkValue, queryInt } from "@/global/check.ts";
import routeGroup from "../_route.ts";
import { requiredLogin } from "@/middleware/auth.ts";
import { GetUserQuestionResult } from "@/dto.ts";
import { HttpError } from "@/global/errors.ts";
import { getQuestionDetail } from "../_sql/question_get.sql.ts";

export default routeGroup.create({
  method: "GET",
  routePath: "/question/entity/:question_id",
  middlewares: [requiredLogin],
  async validateInput(ctx) {
    const questionId = checkValue(ctx.req.param("question_id"), queryInt);
    const currentUserId = await ctx.get("userInfo").getUserId();
    return { questionId, currentUserId };
  },
  async handler({ questionId, currentUserId }): Promise<GetUserQuestionResult> {
    const question = await getQuestionDetail(questionId, currentUserId);
    if (!question) {
      throw new HttpError(400, "题目不存在，或没有权限");
    }
    return { item: question };
  },
});
