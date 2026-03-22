import routeGroup from "./_route.ts";
import { checkValue, queryInt } from "@/global/check.ts";
import { getUserQuestionPublicList } from "./_sql/question_get.sql.ts";
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
    return { ...param, currentUserId };
  },
  handler({ cursor, currentUserId }): Promise<GetUserQuestionListResult> {
    return getUserQuestionPublicList({ isOwner: true, userId: currentUserId }, { cursorNext: cursor });
  },
});
