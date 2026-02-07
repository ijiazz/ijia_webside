import { requiredRoles, Role } from "@/middleware/auth.ts";
import routeGroup from "./_route.ts";
import { getReviewNext } from "./-sql/get_review_list.ts";
import { GetReviewNextResult, ReviewTargetType } from "@/dto.ts";
import { HttpError } from "@/global/errors.ts";
import { checkPermission } from "./-utils/permission.ts";

export default routeGroup.create({
  method: "GET",
  routePath: "/review/next/:type",
  middlewares: [requiredRoles(Role.Admin, Role.PostReviewer)],
  async validateInput(ctx) {
    const { req } = ctx;
    const roles = await ctx.get("userInfo").getRolesFromDb();
    const type = req.param("type") as ReviewTargetType;

    const roleId = new Set<Role>(roles.role_id_list as Role[]);
    if (!checkPermission(type, roleId)) {
      throw new HttpError(403, "没有权限审核该类型内容");
    }
    return {
      type,
    };
  },
  async handler({ type }): Promise<GetReviewNextResult> {
    const target = await getReviewNext(type);
    return { item: target };
  },
});
