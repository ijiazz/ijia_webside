import routeGroup from "./_route.ts";
import { checkValue, queryInt } from "@/global/check.ts";
import { getUserQuestionPublicList } from "./_sql/user_list.sql.ts";
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
      user_id: optional(queryInt, undefined, currentUserId),
      cursor: optional.string,
    });
    return { ...param, currentUserId };
  },
  handler({ user_id, cursor, currentUserId }): Promise<GetUserQuestionListResult> {
    const isOwner = user_id === currentUserId;
    return getUserQuestionPublicList({ isOwner, userId: user_id }, { cursorNext: cursor });
  },
});
