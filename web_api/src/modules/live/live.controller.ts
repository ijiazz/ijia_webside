import { autoBody } from "@/global/pipe.ts";
import { Controller, Get, PipeInput, PipeOutput } from "@asla/hono-decorator";
import { ScreenAvatarRes, HomePageRes, GodPlatformDto } from "./live.dto.ts";
import { optionalPositiveInt, checkValue } from "@/global/check.ts";
import { genScreenAvatar } from "./sql/avatar.ts";
import { pla_user } from "@ijia/data/db";
import { redisPool } from "@ijia/data/cache";
import { dbPool } from "@ijia/data/yoursql";
import { list } from "./home_extra.ts";
import { Context } from "hono";

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

function getZeroMs(): number {
  const now = new Date();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return tomorrow.getTime() - now.getTime();
}
export const liveController = new LiveController();
