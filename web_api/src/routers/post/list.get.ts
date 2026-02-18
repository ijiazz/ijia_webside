import { PostListResponse } from "@/dto.ts";
import { checkValue } from "@/global/check.ts";
import { ListParamSchema } from "./-schema/listParam.ts";
import { getPublicPostList } from "./-sql/post_list.sql.ts";
import routeGroup from "./_route.ts";

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
  async handler({ params, currentUserId }, ctx): Promise<PostListResponse> {
    return getPublicPostList(params, { currentUserId });
  },
});
