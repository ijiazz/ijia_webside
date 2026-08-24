import { CreateCommentOutput } from "@/dto.ts";
import { createRoute } from "@/common/context.ts";
import { HttpError } from "@/common/errors.ts";
import { checkCanCreate, getUserCanCreateCommentLimit } from "./-sql/comment.sql.ts";
import { checkValueAsync, optionalInt, queryInt } from "@/common/check.ts";
import { appConfig, ENV } from "@/config.ts";
import { ExpectType } from "@asla/wokao";
import { createComment } from "@ijia/school-db/query";

const BodySchema = {
  comment_reply_id: optionalInt,
  comment_tree_id: queryInt,
  text: "string",
} satisfies ExpectType;

export default createRoute({
  method: "PUT",
  routePath: "/comment",
  async validateInput(ctx) {
    const userId = await ctx.get("userInfo").getUserId();
    const param = await checkValueAsync(ctx.req.json(), BodySchema);
    if (param.text.length > 1000) {
      throw new HttpError(400, "评论内容长度不合法");
    }

    return { userId, param };
  },
  async handler({ param, userId }): Promise<CreateCommentOutput> {
    if (!appConfig.post?.allowAddComment) throw new HttpError(403, "服务器已禁止新增评论");
    if (ENV.IS_PROD) {
      const canCreate = await getUserCanCreateCommentLimit(userId);
      if (!canCreate) throw new HttpError(403, "操作过于频繁");
    }
    const checkResult = await checkCanCreate(param.comment_tree_id, userId);
    if (!checkResult.canCreate) throw new HttpError(404, checkResult.reason ?? "无法创建评论");

    const res = await createComment({
      comment_tree_id: param.comment_tree_id,
      text: param.text,
      replyCommentId: param.comment_reply_id,
      userId,
    });
    if (typeof res.id !== "number") throw new HttpError(404, res.error ?? "评论创建失败");

    return { comment_id: res.id.toString() };
  },
});
