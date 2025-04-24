import { Controller, Get, ToArguments, Use } from "@asla/hono-decorator";
import { getGodPost } from "./sql/post.ts";
import { GetPostListParam, LivePostResponse } from "./post.dto.ts";
import { autoBody } from "@/global/pipe.ts";
import { enumPlatform } from "@ijia/data/db";
import { checkValue } from "@/global/check.ts";
import { enumType, integer, optional } from "@asla/wokao";
import { HonoContext } from "@/hono/type.ts";
import { Role, rolesGuard } from "@/global/auth.ts";
import { getCheckerServer } from "@/services/douyin.ts";

@Use(rolesGuard)
@autoBody
@Controller({})
class PostController {
  async getPostList(option: GetPostListParam = {}, userId?: number): Promise<LivePostResponse> {
    const DEFAULT_NUMBER = 10;
    const LIMIT = 10;
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

    const isAdmin: boolean = await ctx
      .get("userInfo")
      .getRolesFromDb()
      .then(
        ({ role_id_list }) => role_id_list.includes(Role.Admin),
        () => false,
      );

    return [params, isAdmin];
  })
  @Get("/post/god_list")
  async getPostNewest(option: GetPostListParam, isAdmin: boolean) {
    if (isAdmin) return this.getPostList(option);
    return getCheckerServer().getNewsPost();
  }
}

export const postController = new PostController();
