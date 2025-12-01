import { PostResponse } from "@/dto/post.ts";
import { checkValue } from "@/global/check.ts";
import { integer, optional } from "@asla/wokao";
import { getPostList } from "./-sql/post_list.sql.ts";
import routeGroup from "./_route.ts";

export default routeGroup.create({
  method: "GET",
  routePath: "/post/list",
  async validateInput(ctx) {
    const userInfo = ctx.get("userInfo");
    const userId = await userInfo.getUserId().catch(() => undefined);
    const queries = ctx.req.query();
    const params = checkValue(queries, {
      cursor: optional.string,
      self: optional((value) => value === "true"),
      number: optional(integer({ acceptString: true, min: 1, max: 100 })),
      userId: optional(integer.positive),
      post_id: optional(integer.positive),

      group_id: optional(integer({ acceptString: true })),
    });
    return { params, userId };
  },
  async handler({ params, userId: currentUserId }): Promise<PostResponse> {
    if (params.self && typeof currentUserId !== "number") return { needLogin: true, has_more: false, items: [] };
    return getPostList(params, { currentUserId });
  },
});
