import { createRoute } from "@/hono/route.ts";
import { CreatePostCommentResponse, CreatePostCommentParam } from "@/modules/post/comment.dto.ts";
import { createComment as createCommentSql, getUserCanCreateCommentLimit } from "@/modules/post/sql/post_comment.ts";
import { HttpError } from "@/global/errors.ts";
import { appConfig, ENV } from "@/config.ts";
import { checkValue, optionalInt, queryInt } from "@/global/check.ts";

export const Route = createRoute({
  method: "PUT",
  routePath: "/post/content/:postId/comment",

  async verifyInput(ctx) {
    const [userId, rawJson] = await Promise.all([ctx.get("userInfo").getUserId(), ctx.req.json()]);
    const param: CreatePostCommentParam = await checkValue(rawJson, {
      text: "string",
      replyCommentId: optionalInt,
    });
    const postId = checkValue(ctx.req.param("postId"), queryInt);

    if (param.text.length > 1000) {
      throw new HttpError(400, "评论内容长度不合法");
    }
    const muc: string = "sss";
    return muc;
  },
  handler: (ctx, input): string => {
    return input;
  },
});

async function createComment(
  postId: number,
  userId: number,
  param: CreatePostCommentParam,
): Promise<CreatePostCommentResponse> {
  if (!appConfig.post?.allowAddComment) throw new HttpError(403, "服务器已禁止新增评论");
  if (ENV.IS_PROD) {
    //TODO: 需要在事务中执行限制
    const canCreate = await getUserCanCreateCommentLimit(userId);
    if (!canCreate) throw new HttpError(403, "操作过于频繁");
  }
  const created = await createCommentSql(postId, userId, [param]);

  return created[0];
}
