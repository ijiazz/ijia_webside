import { enumPlatform } from "@ijia/data/db";
import { checkValue } from "@/global/check.ts";
import { enumType, integer, optional } from "@asla/wokao";
import { Role } from "@/middleware/auth.ts";
import { getCheckerServer } from "@/services/douyin.ts";

import routeGroup from "./_route.ts";
import { getGodPost } from "./-sql/platform_post.sql.ts";
import { GetPlatformPostListParam, PlatformPostResponse } from "@/dto/post.ts";

export default routeGroup.create({
  method: "GET",
  routePath: "/post/god_list",
  async validateInput(ctx) {
    const params = checkValue(ctx.req.query(), {
      number: optional(integer({ acceptString: true, min: 1, max: 100 })),
      offset: optional(integer({ acceptString: true, min: 0 })),
      platform: optional(enumType(Array.from(enumPlatform))),
      userId: optional.string,
      s_content: optional.string,
      s_author: optional.string,
    });
    const uInfo = ctx.get("userInfo");

    return { params, uInfo };
  },
  async handler({ params: option, uInfo }) {
    const isAdmin: boolean = await uInfo.getRolesFromDb().then(
      ({ role_id_list }) => role_id_list.includes(Role.Admin),
      () => false,
    );
    if (isAdmin) {
      const userId = await uInfo.getUserId();
      return getPostList(option, userId);
    }
    return getCheckerServer().getNewsPost();
  },
});
async function getPostList(option: GetPlatformPostListParam = {}, userId?: number): Promise<PlatformPostResponse> {
  const DEFAULT_NUMBER = 10;
  const LIMIT = 10;

  //TODO offset 替换为 cursor
  if (option.offset === undefined) option.offset = 0;
  if (option.number === undefined) option.number = DEFAULT_NUMBER;

  let needLogin = false;
  if (!userId) {
    if (option.offset + option.number > LIMIT) {
      option.offset = 0;
      if (option.number > LIMIT) option.number = LIMIT;
      needLogin = true;
    }
  }
  const { items, total } = await getGodPost(option);
  if (needLogin) items.length = 0;
  return { items, total, needLogin };
}
