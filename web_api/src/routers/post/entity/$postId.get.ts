import { GetPostResponse } from "@/dto.ts";
import { checkValue, queryInt } from "@/global/check.ts";
import { getPost } from "../-sql/post_list.sql.ts";
import routeGroup from "../_route.ts";
import { HttpError } from "@/global/errors.ts";

export default routeGroup.create({
  method: "GET",
  routePath: "/post/entity/:postId",
  async validateInput(ctx) {
    const { req } = ctx;
    const postId = checkValue(req.param("postId"), queryInt);
    const userInfo = ctx.get("userInfo");
    const currentUserId = await userInfo.getUserId().catch(() => null);
    return { postId, currentUserId };
  },
  async handler({ postId, currentUserId }, ctx): Promise<GetPostResponse> {
    const post = await getPost(postId, currentUserId);
    if (!post) throw new HttpError(404, "作品不存在");
    return { item: post };
  },
});
