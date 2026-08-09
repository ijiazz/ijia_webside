import routeGroup from "./_route.ts";
import { checkValue } from "@/common/check.ts";
import { getUserQuestionList } from "./_sql/question_get.sql.ts";
import { optional } from "@asla/wokao";
import { GetUserQuestionListResult } from "@/dto.ts";
import { requiredLogin } from "@/middleware/auth.ts";

export default routeGroup.create({
  method: "GET",
  routePath: "/question/list_user",
  middlewares: [requiredLogin],
  async validateInput(ctx) {
    const currentUserId = await ctx.get("userInfo").getUserId();
    const param = checkValue(ctx.req.query(), {
      cursor: optional.string,
    });
    return { cursor: param.cursor, currentUserId };
  },
  handler({ cursor, currentUserId }): Promise<GetUserQuestionListResult> {
    return getUserQuestionList(currentUserId, { cursorNext: cursor });
  },
});
