import { Controller, Get, ToArguments, Use } from "@asla/hono-decorator";
import { getGodPost } from "./sql/platform_post.ts";
import { GetPlatformPostListParam, PlatformPostResponse } from "./platform_post.dto.ts";
import { autoBody } from "@/global/pipe.ts";
import { enumPlatform } from "@ijia/data/db";
import { checkValue } from "@/global/check.ts";
import { enumType, integer, optional } from "@asla/wokao";
import { HonoContext } from "@/hono/type.ts";
import { Role, identity, UserInfo } from "@/global/auth.ts";
import { getCheckerServer } from "@/services/douyin.ts";
import { GetPostListParam } from "./post.dto.ts";

@Use(identity)
@autoBody
@Controller({})
class PlatformPostController {
  async getPostList(option: GetPlatformPostListParam = {}, userId?: number): Promise<PlatformPostResponse> {
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
  @ToArguments(async (ctx: HonoContext) => {
    const params = checkValue(ctx.req.query(), {
      number: optional(integer({ acceptString: true, min: 1, max: 100 })),
      offset: optional(integer({ acceptString: true, min: 0 })),
      platform: optional(enumType(Array.from(enumPlatform))),
      userId: optional.string,
      s_content: optional.string,
      s_author: optional.string,
    });
    const uInfo = ctx.get("userInfo");

    return [params, uInfo];
  })
  @Get("/post/god_list")
  async getPostNewest(option: GetPostListParam, uInfo: UserInfo) {
    const isAdmin: boolean = await uInfo.getRolesFromDb().then(
      ({ role_id_list }) => role_id_list.includes(Role.Admin),
      () => false,
    );
    if (isAdmin) {
      const userId = await uInfo.getUserId();
      return this.getPostList(option, userId);
    }
    return getCheckerServer().getNewsPost();
  }
}

export const platformPostController = new PlatformPostController();
