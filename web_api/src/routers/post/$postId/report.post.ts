import { checkValue, checkValueAsync } from "@/global/check.ts";
import { reportPost } from "../-sql/report.sql.ts";
import routeGroup from "../_route.ts";
import { integer, optional } from "@asla/wokao";

export default routeGroup.create({
  method: "POST",
  routePath: "/post/report/:postId",
  async validateInput(ctx) {
    const userInfo = ctx.get("userInfo");
    const userId = await userInfo.getUserId();
    const postId = checkValue(ctx.req.param("postId"), integer.positive);
    const data = await checkValueAsync(ctx.req.json(), {
      reason: optional.string,
    });
    return { userId, postId, data };
  },
  async handler({ data, postId, userId }): Promise<{ success: boolean }> {
    const count = await reportPost(postId, userId, data.reason);
    return { success: count > 0 };
  },
});
