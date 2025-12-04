import { cancelPostLike, setPostLike } from "../../-sql/post_like.sql.ts";
import { checkValue } from "@/global/check.ts";
import { integer } from "@asla/wokao";
import routeGroup from "../../_route.ts";

export default routeGroup.create({
  method: "POST",
  routePath: "/post/entity/:postId/like",
  async validateInput(ctx) {
    const { req } = ctx;
    const userInfo = ctx.get("userInfo");
    const userId = await userInfo.getUserId();
    const postId = checkValue(req.param("postId"), integer.positive);
    const isCancel = req.query("isCancel") === "true";
    return { userId, postId, isCancel };
  },
  async handler({ userId, postId, isCancel }) {
    let count: number;
    if (isCancel) {
      count = await cancelPostLike(postId, userId);
    } else {
      count = await setPostLike(postId, userId);
    }
    return { success: count > 0 };
  },
});
