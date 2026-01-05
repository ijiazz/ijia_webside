import { CreatePostCommentResponse } from "@/dto.ts";
import routeGroup from "../_route.ts";
import { HttpError } from "@/global/errors.ts";
import { createComment, getUserCanCreateCommentLimit } from "../-sql/post_comment.sql.ts";
import { checkValueAsync, optionalInt } from "@/global/check.ts";
import { appConfig, ENV } from "@/config.ts";
import { integer } from "@asla/wokao";

export default routeGroup.create({
  method: "PUT",
  routePath: "/post/comment/entity",
  async validateInput(ctx) {
    const userId = await ctx.get("userInfo").getUserId();
    const param = await checkValueAsync(ctx.req.json(), {
      postId: integer(),
      text: "string",
      replyCommentId: optionalInt,
    });
    if (param.text.length > 1000) {
      throw new HttpError(400, "评论内容长度不合法");
    }

    return { userId, param };
  },
  async handler({ param, userId }): Promise<CreatePostCommentResponse> {
    if (!appConfig.post?.allowAddComment) throw new HttpError(403, "服务器已禁止新增评论");
    if (ENV.IS_PROD) {
      //TODO: 需要在事务中执行限制
      const canCreate = await getUserCanCreateCommentLimit(userId);
      if (!canCreate) throw new HttpError(403, "操作过于频繁");
    }
    //TODO: 优化参数
    const { postId, ...rest } = param;
    const created = await createComment(postId, userId, [rest]);

    return created[0];
  },
});
