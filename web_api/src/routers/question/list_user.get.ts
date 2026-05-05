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
      userId: optional(queryInt),
    });
    const targetUserId = param.userId ?? currentUserId;
    return { cursor: param.cursor, currentUserId, targetUserId };
  },
  handler({ cursor, targetUserId, currentUserId }): Promise<GetUserQuestionListResult> {
    return getUserQuestionPublicList(
      { isOwner: targetUserId === currentUserId, userId: targetUserId },
      { cursorNext: cursor },
    );
  },
});
