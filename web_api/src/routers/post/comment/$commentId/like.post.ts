import { checkValue, queryInt } from "@/global/check.ts";
import routeGroup from "../_route.ts";
import { cancelCommentLike, setCommentLike } from "../../-sql/post_like.sql.ts";

export default routeGroup.create({
  method: "POST",
  routePath: "/post/comment/like/:commentId",
  async validateInput(ctx) {
    const commentId = checkValue(ctx.req.param("commentId"), queryInt);
    const isCancel = checkValue(ctx.req.query("isCancel"), (value) => (value === "true" ? true : false));
    const userId = await ctx.get("userInfo").getUserId();
    return { commentId, userId, isCancel };
  },
  async handler({ commentId, userId, isCancel }): Promise<{
    success: boolean;
  }> {
    let number: number;
    if (isCancel) {
      number = await cancelCommentLike(commentId, userId);
    } else number = await setCommentLike(commentId, userId);
    return { success: number === 1 };
  },
});
