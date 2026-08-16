import { checkValueAsync } from "@/common/check.ts";
import routeGroup from "../_route.ts";
import { COMMIT_REVIEW_PARAM_SCHEMA } from "../-utils/commit.schema.ts";
import { requiredRoles } from "@/middleware/auth.ts";
import { commitPostReview, CommitPostReviewParam } from "../-sql/post.ts";
import { CommitReviewResult, ReviewTargetType } from "@/dto.ts";
import { getReviewNext } from "../-sql/get_review_list.ts";
import { Role } from "@/common/userInfo.ts";

export default routeGroup.create({
  method: "POST",
  routePath: "/review/commit/post",
  middlewares: [requiredRoles(Role.Admin, Role.PostReviewer)],
  async validateInput(ctx) {
    const userInfo = ctx.get("userInfo");
    const reviewerId = await userInfo.getUserId();

    const param = await checkValueAsync(ctx.req.json(), COMMIT_REVIEW_PARAM_SCHEMA);
    return {
      param,
      reviewerId,
    };
  },
  async handler({ param, reviewerId }): Promise<CommitReviewResult> {
    const commitParam: CommitPostReviewParam = {
      reviewId: param.review_id,
      isPass: param.is_passed,
      reviewerId,
      remark: param.remark,
    };
    const count = await commitPostReview(commitParam);
    const next = await getReviewNext(ReviewTargetType.post);
    return { next, success: count > 0 };
  },
});
