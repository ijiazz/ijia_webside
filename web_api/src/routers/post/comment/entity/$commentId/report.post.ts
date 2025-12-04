import { checkValue, queryInt } from "@/global/check.ts";
import routeGroup from "../../_route.ts";
import { reportComment } from "../../../-sql/report.sql.ts";

export default routeGroup.create({
  method: "POST",
  routePath: "/post/comment/entity/:commentId/report",
  async validateInput(ctx) {
    const commentId = checkValue(ctx.req.param("commentId"), queryInt);
    const userId = await ctx.get("userInfo").getUserId();
    return { commentId, userId, reason: undefined };
  },
  async handler({ commentId, userId, reason }) {
    const number = await reportComment(commentId, userId, reason);
    return { success: number === 1 };
  },
});
