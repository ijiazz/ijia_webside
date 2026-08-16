import { checkValue, queryInt } from "@/common/check.ts";
import routeGroup from "./_route.ts";
import { deleteComment } from "./-sql/comment.sql.ts";

export default routeGroup.create({
  method: "DELETE",
  routePath: "/comment/:commentId",
  async validateInput(ctx) {
    const commentId = checkValue(ctx.req.param("commentId"), queryInt);
    const userId = await ctx.get("userInfo").getUserId();
    return { commentId, userId };
  },
  async handler({ commentId, userId }) {
    await deleteComment(commentId, userId);
  },
});
