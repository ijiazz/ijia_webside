import { Controller, Get, Post, ToArguments, Use } from "@asla/hono-decorator";
import { autoBody } from "@/global/pipe.ts";
import { identity, Role, Roles } from "@/middleware/auth.ts";
import { CommitReviewParam, PostReviewItemDto, CommitReviewResultDto, PostReviewType } from "./PostReview.dto.ts";
import { commitReview, getReview } from "./sql/post_review.ts";
import { HonoContext } from "@/hono/type.ts";
import { checkValue, checkValueAsync } from "@/global/check.ts";
import { enumType, integer, optional } from "@asla/wokao";

@Use(identity)
@autoBody
@Controller({})
class PostReviewController {
  @Roles(Role.Admin, Role.PostReviewer)
  @Get("/post/review/next")
  async getReviewNext(): Promise<PostReviewItemDto> {
    const target = await getReview();
    return { next: target };
  }

  @ToArguments(async (ctx: HonoContext) => {
    const reviewId = checkValue(ctx.req.param("reviewId"), "string");

    const reviewerId = ctx.get("userInfo").getUserId();
    const param = checkValueAsync(ctx.req.json(), {
      isPass: "boolean",
      remark: optional.string,
    });
    return Promise.all([reviewerId, reviewId, param]);
  })
  @Roles(Role.Admin, Role.PostReviewer)
  @Post("/post/review/entity/:reviewId/commit")
  async commitReview(reviewerId: number, reviewId: string, param: CommitReviewParam): Promise<CommitReviewResultDto> {
    let targetType: PostReviewType;
    let targetId: number;
    {
      const [type, id] = reviewId.split("-");
      targetType = type as PostReviewType;
      checkValue(targetType, enumType([PostReviewType.post, PostReviewType.postComment]));
      targetId = checkValue(id, integer({ acceptString: true }));
    }

    const count = await commitReview(targetType, targetId, param.isPass, reviewerId, param.remark);
    const next = await this.getReviewNext();
    return { ...next, success: count > 0 };
  }
}
export const postReviewController = new PostReviewController();
