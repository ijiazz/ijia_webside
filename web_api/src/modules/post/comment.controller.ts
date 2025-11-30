import { Controller, Delete, Get, Post, Put, ToArguments, Use } from "@asla/hono-decorator";
import { autoBody } from "@/global/pipe.ts";
import { identity } from "@/middleware/auth.ts";
import { CreatePostCommentResponse, CreatePostCommentParam, GetPostCommentListParam } from "./comment.dto.ts";
import { HonoContext } from "@/hono/type.ts";
import { checkValue, checkValueAsync, optionalInt, queryInt } from "@/global/check.ts";
import { ExpectType, optional } from "@asla/wokao";
import { createComment, getCommentList, getUserCanCreateCommentLimit, deleteComment } from "./sql/post_comment.ts";
import { HttpError } from "@/global/errors.ts";
import { appConfig, ENV } from "@/config.ts";
import { cancelCommentLike, setCommentLike } from "./sql/post_like.ts";
import { reportComment } from "./sql/report.ts";

@Use(identity)
@autoBody
@Controller({})
class CommentController {
  @ToArguments(async (ctx: HonoContext) => {
    const userId = await ctx.get("userInfo").getUserId();
    const postId = checkValue(ctx.req.param("postId"), queryInt);
    const param = await checkValueAsync(ctx.req.json(), {
      text: "string",
      replyCommentId: optionalInt,
    });
    if (param.text.length > 1000) {
      throw new HttpError(400, "评论内容长度不合法");
    }

    return [postId, userId, param];
  })
  @Put("/post/content/:postId/comment")
  async createComment(
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
    const created = await createComment(postId, userId, [param]);

    return created[0];
  }

  @ToArguments(async (ctx: HonoContext) => {
    const userId = await ctx
      .get("userInfo")
      .getUserId()
      .catch(() => undefined);

    const postId = checkValue(ctx.req.param("postId"), queryInt);
    const option = checkValue(ctx.req.query(), getCommentListChecker);

    return [postId, { ...option, userId }];
  })
  @Get("/post/content/:postId/comment")
  getPostCommentList(postId: number, option: GetPostCommentListParam & { userId?: number }) {
    return getCommentList({ postId }, option);
  }

  @ToArguments(async (ctx: HonoContext) => {
    const userId = await ctx
      .get("userInfo")
      .getUserId()
      .catch(() => undefined);

    const commentId = checkValue(ctx.req.param("commentId"), queryInt);
    const option = checkValue(ctx.req.query(), getCommentListChecker);

    return [commentId, { ...option, userId }];
  })
  @Get("/post/comment/entity/:commentId/root_list")
  getPostCommentReplyList(commentId: number, option: GetPostCommentListParam & { userId?: number }) {
    return getCommentList({ rootCommentId: commentId }, option);
  }

  @ToArguments(async (ctx: HonoContext) => {
    const commentId = checkValue(ctx.req.param("commentId"), queryInt);
    const userId = await ctx.get("userInfo").getUserId();
    return [commentId, userId];
  })
  @Delete("/post/comment/entity/:commentId")
  async deleteComment(commentId: number, userId: number) {
    await deleteComment(commentId, userId);
  }

  @ToArguments(async (ctx: HonoContext) => {
    const commentId = checkValue(ctx.req.param("commentId"), queryInt);
    const isCancel = checkValue(ctx.req.query("isCancel"), (value) => (value === "true" ? true : false));
    const userId = await ctx.get("userInfo").getUserId();
    return [commentId, userId, isCancel];
  })
  @Post("/post/comment/like/:commentId")
  async setCommentLike(
    commentId: number,
    userId: number,
    isCancel?: boolean,
  ): Promise<{
    success: boolean;
  }> {
    let number: number;
    if (isCancel) {
      number = await cancelCommentLike(commentId, userId);
    } else number = await setCommentLike(commentId, userId);
    return { success: number === 1 };
  }
  @ToArguments(async (ctx: HonoContext) => {
    const commentId = checkValue(ctx.req.param("commentId"), queryInt);
    const userId = await ctx.get("userInfo").getUserId();
    return [commentId, userId];
  })
  @Post("/post/comment/report/:commentId")
  async reportComment(
    commentId: number,
    userId: number,
    reason?: string,
  ): Promise<{
    success: boolean;
  }> {
    const number = await reportComment(commentId, userId, reason);
    return { success: number === 1 };
  }
}

export const commentController = new CommentController();

const getCommentListChecker = {
  number: optionalInt,
  cursor: optional.string,
  commentId: optionalInt,
} satisfies ExpectType;
