import { checkValue, checkValueAsync } from "@/global/check.ts";
import routeGroup from "../../_route.ts";
import { enumType, integer, optional } from "@asla/wokao";
import { CommitReviewResultDto, PostReviewType } from "../../-api.ts";
import { commitReview, getReview } from "../-sql/post_review.sql.ts";
import { requiredRoles, Role } from "@/middleware/auth.ts";

export default routeGroup.create({
  method: "POST",
  routePath: "/post/review/entity/:reviewId/commit",
  middlewares: [requiredRoles(Role.Admin, Role.PostReviewer)],
  async validateInput(ctx) {
    const reviewId = checkValue(ctx.req.param("reviewId"), "string");

    const reviewerId = ctx.get("userInfo").getUserId();
    const param = await checkValueAsync(ctx.req.json(), {
      isPass: "boolean",
      remark: optional.string,
    });
    return Promise.all([reviewerId, param]).then(([reviewerId, param]) => ({
      reviewerId,
      reviewId,
      param,
    }));
  },
  async handler({ param, reviewId, reviewerId }): Promise<CommitReviewResultDto> {
    let targetType: PostReviewType;
    let targetId: number;
    {
      const [type, id] = reviewId.split("-");
      targetType = type as PostReviewType;
      checkValue(targetType, enumType([PostReviewType.post, PostReviewType.postComment]));
      targetId = checkValue(id, integer({ acceptString: true }));
    }

    const count = await commitReview(targetType, targetId, param.isPass, reviewerId, param.remark);
    const next = await getReview();
    return { next, success: count > 0 };
  },
});
