import { checkValue, queryInt } from "@/global/check.ts";
import routeGroup from "../_route.ts";
import { deleteComment } from "@/routers/post/comment/-sql/post_comment.sql.ts";

export default routeGroup.create({
  method: "DELETE",
  routePath: "/post/comment/entity/:commentId",
  async validateInput(ctx) {
    const commentId = checkValue(ctx.req.param("commentId"), queryInt);
    const userId = await ctx.get("userInfo").getUserId();
    return { commentId, userId };
  },
  async handler({ commentId, userId }) {
    await deleteComment(commentId, userId);
  },
});
