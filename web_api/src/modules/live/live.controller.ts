import { autoBody } from "@/global/pipe.ts";
import { Controller, Get, PipeInput, PipeOutput } from "@asla/hono-decorator";
import { ScreenAvatarRes, HomePageRes, GodPlatformDto, GetBulletChatListRes, GetBulletChatParam } from "../../dto/live.ts";
import { optionalPositiveInt, checkValue, optionalInt } from "@/global/check.ts";
import { genScreenAvatar } from "./sql/avatar.ts";
import { pla_user } from "@ijia/data/db";
import { redisPool } from "@ijia/data/cache";
import { dbPool } from "@ijia/data/dbclient";
import { list } from "./home_extra.ts";
import { Context } from "hono";
import { genGetBulletChart } from "./sql/bullet.sql.ts";
import { appConfig } from "@/config.ts";
import { select } from "@asla/yoursql";

@autoBody
@Controller({})
class LiveController {
  @PipeOutput((result, ctx) => {
    return ctx.body(result, { headers: { "Content-Type": "application/json" } });
  })
  @Get("/live/screen/avatar")
  async getLiveList(ctx: Context): Promise<string> {
    if (!this.#screenAvatarCache) {
      this.#screenAvatarCache = this.getScreenAvatarTryCache().finally(() => {
        this.#screenAvatarCache = undefined;
      });
    }
    const { data, zeroMs } = await this.#screenAvatarCache;
    if (zeroMs) ctx.header("Cache-Control", `public, max-age=${Math.floor(zeroMs / 1000)}`);
    return data;
  }
  #screenAvatarCache?: Promise<{ data: string; zeroMs?: number }>;
  async getScreenAvatarTryCache(): Promise<{ data: string; zeroMs?: number }> {
    using conn = await redisPool.connect();
    const key = "live:avatar";
    let cache = await conn.get(key);
    let expMs: undefined | number;
    if (!cache) {
      const limit = 400;
      const items = await genScreenAvatar(limit);
      const data: ScreenAvatarRes = {
        items: items,
        total: items.length,
        limit: limit,
      };
      cache = JSON.stringify(data);

      if (items.length >= limit) {
        expMs = getZeroMs(); // 次日零点过期。如果数量不到limit
      } else {
        expMs = 1000 * 60;
      }
      await conn.set(key, cache, { EX: Math.floor(expMs / 1000) });
    } else expMs = getZeroMs();

    return { data: cache, zeroMs: expMs };
  }
  @PipeInput((ctx) => {
    const queries = ctx.req.query();
    return checkValue(queries, { offset: optionalPositiveInt, number: optionalPositiveInt });
  })
  @Get("/live/screen/home")
  async getHomeData(): Promise<HomePageRes> {
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

  @PipeInput((ctx) => {
    const queries = ctx.req.query();
    return checkValue(queries, { index: optionalInt });
  })
  @Get("/live/screen/bullet-chart")
  async getBulletChart(param: GetBulletChatParam): Promise<GetBulletChatListRes> {
    const { index = 0 } = param;
    const bulletChartConfig = appConfig.home.bulletChart;

    const target = bulletChartConfig.find((config) => {
      if (!config.enable) return false;
      const { enableDateEnd, enableDateStart } = config;
      const now = new Date();
      if (enableDateStart && now < enableDateStart) return false;
      if (enableDateEnd && now > enableDateEnd) return false;

      return true;
    });
    if (!target) {
      return {
        has_more: false,
        items: [],
      };
    }
    const pageSize = 50;
    const res = await genGetBulletChart({
      groupId: target.usePostId,
      pageSize,
      page: index,
    });
    return {
      items: res,
      has_more: res.length >= pageSize,
    };
  }
}

function getZeroMs(): number {
  const now = new Date();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return tomorrow.getTime() - now.getTime();
}
export const liveController = new LiveController();
