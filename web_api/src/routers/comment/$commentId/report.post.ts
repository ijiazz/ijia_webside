import { checkValue, checkValueAsync, queryInt } from "@/common/check.ts";
import routeGroup from "../_route.ts";
import { reportComment } from "../-sql/like.sql.ts";
import { optional } from "@asla/wokao";

export default routeGroup.create({
  method: "POST",
  routePath: "/comment/:commentId/report",
  async validateInput(ctx) {
    const commentId = checkValue(ctx.req.param("commentId"), queryInt);
    const userId = await ctx.get("userInfo").getUserId();
    const { reason } = await checkValueAsync(ctx.req.json(), { reason: optional.string });
    return { commentId, userId, reason };
  },
  async handler({ commentId, userId, reason }) {
    const number = await reportComment(commentId, userId, reason);
    return { success: number === 1 };
  },
});
