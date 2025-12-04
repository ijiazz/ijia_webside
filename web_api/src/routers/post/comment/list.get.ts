import { checkValue, optionalInt } from "@/global/check.ts";
import routeGroup from "./_route.ts";
import { ExpectType, optional } from "@asla/wokao";
import { GetPostCommentListParam, PostCommentResponse } from "@/dto/post_comment.ts";
import { getCommentList } from "./-sql/get_comment.sql.ts";

export default routeGroup.create({
  method: "GET",
  routePath: "/post/comment/list",
  async validateInput(ctx) {
    const userId = await ctx
      .get("userInfo")
      .getUserId()
      .catch(() => undefined);

    const option = checkValue(ctx.req.query(), getCommentListChecker);

    return { option: option as GetPostCommentListParam, userId };
  },
  async handler({ option, userId }): Promise<PostCommentResponse> {
    return getCommentList(option, userId || null);
  },
});

const getCommentListChecker = {
  number: optionalInt,
  cursor: optional.string,

  postId: optionalInt,
  commentId: optionalInt,
  parentCommentId: optionalInt,
} satisfies ExpectType;
