import routeGroup from "./_route.ts";
import { getReviewNext } from "./-sql/get_review_list.ts";
import { GetReviewNextResult, ReviewTargetType } from "@/dto.ts";
import { HttpError } from "@/global/errors.ts";
import { checkPermission } from "./-utils/permission.ts";

export default routeGroup.create({
  method: "GET",
  routePath: "/review/next/:type",
  async validateInput(ctx) {
    const { req } = ctx;
    const userInfo = await ctx.get("userInfo");
    const type = req.param("type") as ReviewTargetType;
    const hasPermission = await checkPermission(type, userInfo);
    if (!hasPermission) {
      throw new HttpError(403, "没有权限审核该类型内容");
    }
    return { type };
  },
  async handler({ type }): Promise<GetReviewNextResult> {
    const target = await getReviewNext(type);
    return { item: target };
  },
});
