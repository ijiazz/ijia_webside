import { CreatePostCommentResponse } from "@/dto/post_comment.ts";
import routeGroup from "./_route.ts";
import { HttpError } from "@/global/errors.ts";
import { createComment, getUserCanCreateCommentLimit } from "./-sql/post_comment.sql.ts";
import { checkValue, checkValueAsync, optionalInt, queryInt } from "@/global/check.ts";
import { appConfig, ENV } from "@/config.ts";

export default routeGroup.create({
  method: "PUT",
  routePath: "/post/content/:postId/comment",
  async validateInput(ctx) {
    const userId = await ctx.get("userInfo").getUserId();
    const postId = checkValue(ctx.req.param("postId"), queryInt);
    const param = await checkValueAsync(ctx.req.json(), {
      text: "string",
      replyCommentId: optionalInt,
    });
    if (param.text.length > 1000) {
      throw new HttpError(400, "评论内容长度不合法");
    }

    return { postId, userId, param };
  },
  async handler({ param, postId, userId }): Promise<CreatePostCommentResponse> {
    if (!appConfig.post?.allowAddComment) throw new HttpError(403, "服务器已禁止新增评论");
    if (ENV.IS_PROD) {
      //TODO: 需要在事务中执行限制
      const canCreate = await getUserCanCreateCommentLimit(userId);
      if (!canCreate) throw new HttpError(403, "操作过于频繁");
    }
    const created = await createComment(postId, userId, [param]);

    return created[0];
  },
});
