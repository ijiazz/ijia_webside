import { checkValue, optionalInt, queryInt } from "@/global/check.ts";
import routeGroup from "./_route.ts";
import { ExpectType, optional } from "@asla/wokao";
import { getCommentList } from "./-sql/post_comment.sql.ts";

export default routeGroup.create({
  method: "GET",
  routePath: "/post/content/:postId/comment",
  async validateInput(ctx) {
    const userId = await ctx
      .get("userInfo")
      .getUserId()
      .catch(() => undefined);

    const postId = checkValue(ctx.req.param("postId"), queryInt);
    const option = checkValue(ctx.req.query(), getCommentListChecker);

    return { postId, option: { ...option, userId } };
  },
  async handler({ option, postId }) {
    return getCommentList({ postId }, option);
  },
});

routeGroup.create({
  routePath: "/post/comment/entity/:commentId/root_list",
  method: "GET",
  async validateInput(ctx) {
    const userId = await ctx
      .get("userInfo")
      .getUserId()
      .catch(() => undefined);

    const commentId = checkValue(ctx.req.param("commentId"), queryInt);
    const option = checkValue(ctx.req.query(), getCommentListChecker);

    return {
      commentId,
      option: { ...option, userId },
    };
  },
  handler(input) {
    return getCommentList({ rootCommentId: input.commentId }, input.option);
  },
});

const getCommentListChecker = {
  number: optionalInt,
  cursor: optional.string,
  commentId: optionalInt,
} satisfies ExpectType;
