import { checkValue, queryInt } from "@/common/check.ts";
import { createRoute } from "@/common/context.ts";
import { deleteComment } from "./-sql/comment.sql.ts";

export default createRoute({
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
