import { checkValueAsync } from "@/global/check.ts";
import routeGroup from "./_route.ts";
import { integer, optional } from "@asla/wokao";
import { requiredRoles, Role } from "@/middleware/auth.ts";
import { commitPostReview, commitPostCommentReview, CommitReviewParam } from "./-sql/post.ts";
import { checkPermission } from "./-utils/permission.ts";
import { HttpError } from "@/global/errors.ts";
import { CommitReviewResult, ReviewTargetType } from "@/dto.ts";
import { getReviewNext } from "./-sql/get_review_list.ts";

export default routeGroup.create({
  method: "POST",
  routePath: "/review/commit/:type",
  middlewares: [requiredRoles(Role.Admin, Role.PostReviewer)],
  async validateInput(ctx) {
    const { req } = ctx;
    const type = req.param("type");
    const userInfo = ctx.get("userInfo");

    const { user_id: reviewerId, role_id_list } = await userInfo.getRolesFromDb();
    const roles = new Set(role_id_list as Role[]);
    if (!checkPermission(type, roles)) {
      throw new HttpError(403, "没有权限进行该操作");
    }

    const param = await checkValueAsync(ctx.req.json(), {
      review_id: integer(),
      is_passed: "boolean",
      remark: optional.string,
    });
    return {
      param,
      reviewerId,
      type,
    };
  },
  async handler({ param, reviewerId, type }): Promise<CommitReviewResult> {
    const commitParam: CommitReviewParam = {
      reviewId: param.review_id,
      isPass: param.is_passed,
      reviewerId,
      remark: param.remark,
    };
    let count: number;
    switch (type) {
      case ReviewTargetType.post:
        count = await commitPostReview(commitParam);
        break;
      case ReviewTargetType.post_comment:
        count = await commitPostCommentReview(commitParam);
        break;
      default:
        throw new Error("不支持的审核类型");
    }
    const next = await getReviewNext(type);
    return { next, success: count > 0 };
  },
});
