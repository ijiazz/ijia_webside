import { PostListResponse } from "@/dto.ts";
import { checkValue } from "@/global/check.ts";
import { ListParamSchema } from "./-schema/listParam.ts";
import { getPublicPostList, getSelfPostList } from "./-sql/post_list.sql.ts";
import routeGroup from "./_route.ts";

export default routeGroup.create({
  method: "GET",
  routePath: "/post/user",
  async validateInput(ctx) {
    const userInfo = ctx.get("userInfo");
    const queries = ctx.req.query();
    const params = checkValue(queries, ListParamSchema);

    let currentUserId: number | undefined;
    let userId: number;
    if (params.userId === undefined) {
      currentUserId = await userInfo.getUserId();
      userId = currentUserId;
    } else {
      currentUserId = await userInfo.getUserId().catch(() => undefined);
      userId = params.userId;
    }
    const isSelf = userId === currentUserId;
    return { params, userId, isSelf };
  },
  async handler({ params, userId, isSelf }): Promise<PostListResponse> {
    if (isSelf) return getSelfPostList(userId, params);
    else {
      return getPublicPostList(params, { currentUserId: userId });
    }
  },
});
