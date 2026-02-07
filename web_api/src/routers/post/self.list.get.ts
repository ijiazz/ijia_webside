import { PostResponse } from "@/dto.ts";
import { checkValue } from "@/global/check.ts";
import { ListParamSchema } from "./-schema/listParam.ts";
import { getUserPostList } from "./-sql/post_list.sql.ts";
import routeGroup from "./_route.ts";

export default routeGroup.create({
  method: "GET",
  routePath: "/post/self/list",
  async validateInput(ctx) {
    const userInfo = ctx.get("userInfo");
    const userId = await userInfo.getUserId();
    const queries = ctx.req.query();
    const params = checkValue(queries, ListParamSchema);
    return { params, userId };
  },
  async handler({ params, userId: authorId }): Promise<PostResponse> {
    return getUserPostList(authorId, params);
  },
});
