import { autoBody } from "@/global/pipe.ts";
import { Controller, Get, PipeInput } from "@asla/hono-decorator";
import { ScreenAvatarRes, HomePageRes, GodPlatformDto } from "./live.dto.ts";
import { GetListOption } from "../dto_common.ts";
import { optionalPositiveInt, checkValue } from "@/global/check.ts";
import { getAvatar } from "./sql/avatar.ts";
import { ENV } from "@/config.ts";
import { pla_user } from "@ijia/data/db";
import { dbPool } from "@ijia/data/yoursql";
import { list } from "./home_extra.ts";

@autoBody
@Controller({})
class LiveController {
  @PipeInput((ctx) => {
    const queries = ctx.req.query();
    return checkValue(queries, { offset: optionalPositiveInt, number: optionalPositiveInt });
  })
  @Get("/live/screen/avatar")
  async getLiveList(option: GetListOption): Promise<ScreenAvatarRes> {
    if (ENV.IS_PROD) throw new Error("未开发"); //TODO
    return getAvatar(option);
  }
  @PipeInput((ctx) => {
    const queries = ctx.req.query();
    return checkValue(queries, { offset: optionalPositiveInt, number: optionalPositiveInt });
  })
  @Get("/live/screen/home")
  async getHomeData(): Promise<HomePageRes> {
    const select = {
      platform: true,
      pla_uid: true,
      user_name: true,
      avatar_url: "'/file/avatar/'||avatar",
      stat: "json_build_object('followers_count',follower_count)",
    };
    const dy = pla_user
      .select({ ...select, home_url: "'https://www.douyin.com/user/'||(extra->>'sec_uid')" })
      .where(["platform='douyin' ", " pla_uid='63677127177'"]);
    const wb = pla_user
      .select({ ...select, home_url: "'https://weibo.com/u/'||pla_uid" })
      .where(["platform='weibo' ", " pla_uid='6201382716'"]);
    const [dyData, wbData] = await dbPool.multipleQueryRows<[GodPlatformDto, GodPlatformDto]>([dy, wb].join(";"));

    const platforms: GodPlatformDto[] = [...list];

    const wbCard = wbData[0];
    if (wbCard) {
      platforms.unshift(wbCard);
    }
    const dyCard = dyData[0];
    if (dyCard) {
      platforms.unshift(dyCard);
    }
    return {
      current_user: null,
      god_user: { user_name: platforms[0].user_name, avatar_url: platforms[0].avatar_url },
      god_user_platforms: platforms.sort((a, b) => b.stat.followers_count - a.stat.followers_count),
    };
  }
}
export const liveController = new LiveController();
