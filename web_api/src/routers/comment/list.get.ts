import { checkValue, optionalInt } from "@/common/check.ts";
import routeGroup from "./_route.ts";
import { ExpectType, optional } from "@asla/wokao";
import { GetCommentListOption, GetCommentListOutput } from "@/dto.ts";
import { getCommentList } from "./-sql/get_comment.sql.ts";

export default routeGroup.create({
  method: "GET",
  routePath: "/get-comment/list",
  async validateInput(ctx) {
    const userId = await ctx
      .get("userInfo")
      .getUserId()
      .catch(() => undefined);

    const option = checkValue(ctx.req.query(), getCommentListChecker);

    return { option: option as GetCommentListOption, userId };
  },
  async handler({ option, userId }): Promise<GetCommentListOutput> {
    return getCommentList(option, userId || null);
  },
});

const getCommentListChecker = {
  number: optionalInt,
  cursor: optional.string,

  commentTreeId: optionalInt,
  commentId: optionalInt,
  parentCommentId: optionalInt,
} satisfies ExpectType<GetCommentListOption>;
