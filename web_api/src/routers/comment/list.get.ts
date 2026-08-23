import { checkValue, optionalInt, queryInt } from "@/common/check.ts";
import routeGroup from "./_route.ts";
import { ExpectType, optional } from "@asla/wokao";
import { GetCommentListOutput } from "@/dto.ts";
import { checkGetPermission, getCommentList } from "./-sql/get_comment.sql.ts";
import { HttpError } from "@/common/errors.ts";

export default routeGroup.create({
  method: "GET",
  routePath: "/comment-tree/:commentTreeId/list",
  async validateInput(ctx) {
    const commentTreeId = checkValue(ctx.req.param("commentTreeId"), queryInt);
    const userId = await ctx
      .get("userInfo")
      .getUserId()
      .catch(() => undefined);

    const option = checkValue(ctx.req.query(), getCommentListChecker);

    return { option, userId, commentTreeId };
  },
  async handler({ option, userId = null, commentTreeId }): Promise<GetCommentListOutput> {
    const permission = await checkGetPermission(commentTreeId, userId);
    if (!permission.allow) {
      throw new HttpError(404, permission.reason || "没有权限获取评论列表");
    }
    return getCommentList(commentTreeId, option, userId);
  },
});

const getCommentListChecker = {
  number: optionalInt,
  cursor: optional.string,
  forward: optional.boolean,

  commentId: optionalInt,
  parentCommentId: optionalInt,
} satisfies ExpectType;
