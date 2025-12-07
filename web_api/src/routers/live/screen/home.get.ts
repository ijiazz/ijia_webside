import { HomePageRes, GodPlatformDto } from "@/dto/live.ts";
import { optionalPositiveInt, checkValue } from "@/global/check.ts";
import { pla_user } from "@ijia/data/db";
import { dbPool } from "@/db/client.ts";
import { select } from "@asla/yoursql";

import routeGroup from "../_route.ts";
import { list } from "../-utils/home_extra.ts";
import { QueryRowsResult } from "@asla/pg";

export default routeGroup.create({
  method: "GET",
  routePath: "/live/screen/home",
  async validateInput(ctx) {
    const queries = ctx.req.query();
    return checkValue(queries, { offset: optionalPositiveInt, number: optionalPositiveInt });
  },
  async handler(): Promise<HomePageRes> {
    const selectColumns = {
      platform: true,
      pla_uid: true,
      user_name: true,
      avatar_url: "'/file/avatar/'||avatar",
      stat: "json_build_object('followers_count',follower_count)",
    };
    const dy = select({ ...selectColumns, home_url: "'https://www.douyin.com/user/'||(extra->>'sec_uid')" })
      .from(pla_user.name)
      .where(["platform='douyin' ", " pla_uid='63677127177'"]);
    const wb = select({ ...selectColumns, home_url: "'https://weibo.com/u/'||pla_uid" })
      .from(pla_user.name)
      .where(["platform='weibo' ", " pla_uid='6201382716'"]);
    const [dyData, wbData] = await dbPool
      .query<[QueryRowsResult<GodPlatformDto>, QueryRowsResult<GodPlatformDto>]>([dy, wb])
      .then(([r1, r2]) => [r1.rows, r2.rows]);

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
  },
});
