import { deletePost } from "../-sql/post_delete.sql.ts";
import { checkValue } from "@/global/check.ts";
import { integer } from "@asla/wokao";
import { HttpError } from "@/global/errors.ts";

import routeGroup from "../_route.ts";

export default routeGroup.create({
  method: "DELETE",
  routePath: "/post/entity/:postId",
  async validateInput(ctx) {
    const userInfo = ctx.get("userInfo");
    const postId = checkValue(ctx.req.param("postId"), integer.positive);
    const userId = await userInfo.getUserId();
    return { postId, userId };
  },
  async handler({ postId, userId }) {
    const count = await deletePost(postId, userId);
    if (count === 0) {
      throw new HttpError(404, "帖子不存在或已被删除");
    }
  },
});
