import { PostResponse } from "@/dto.ts";
import { checkValue } from "@/global/check.ts";
import { ListParamSchema } from "./-schema/listParam.ts";
import { getPublicPostList, getUserPostList } from "./-sql/post_list.sql.ts";
import routeGroup from "./_route.ts";
import { Role } from "@/middleware/auth.ts";

export default routeGroup.create({
  method: "GET",
  routePath: "/post/list",
  async validateInput(ctx) {
    const { req } = ctx;
    const queries = req.query();
    const userInfo = ctx.get("userInfo");
    const currentUserId = await userInfo.getUserId().catch(() => undefined);

    const params = checkValue(queries, ListParamSchema);
    return { params, currentUserId };
  },
  async handler({ params, currentUserId }, ctx): Promise<PostResponse> {
    if (typeof params.userId === "number") {
      const hasPermission =
        params.userId === currentUserId ||
        (await ctx
          .get("userInfo")
          .hasRolePermission(Role.Root)
          .catch(() => false));
      if (hasPermission) {
        return getUserPostList(params.userId, params);
      }
    }
    return getPublicPostList(params, { currentUserId });
  },
});
