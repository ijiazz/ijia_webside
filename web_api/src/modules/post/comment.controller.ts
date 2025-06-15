import { Controller, Get, Put, ToArguments, Use } from "@asla/hono-decorator";
import { autoBody } from "@/global/pipe.ts";
import { identity } from "@/global/auth.ts";
import { CreatePostCommentParam } from "./comment.dto.ts";
import { HonoContext } from "@/hono/type.ts";
import { checkValue, checkValueAsync } from "@/global/check.ts";
import { integer, optional } from "@asla/wokao";
import { createComment } from "./sql/post_comment.ts";

@Use(identity)
@autoBody
@Controller({})
class CommentController {
  @ToArguments(async (ctx: HonoContext) => {
    const userId = await ctx.get("userInfo").getUserId();
    const postId = checkValue(ctx.req.param("postId"), integer({ acceptString: true }));
    const param = await checkValueAsync(ctx.req.json(), {
      text: "string",
      replyCommentId: optional(integer({ acceptString: true })),
    });

    return [postId, userId, param];
  })
  @Put("/post/content/:postId/comment")
  async createComment(postId: number, userId: number, param: CreatePostCommentParam) {
    const commentId = await createComment(postId, userId, param);

    return { id: commentId };
  }
}

export const commentController = new CommentController();
