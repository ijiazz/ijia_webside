import routeGroup from "../_route.ts";
import { ScreenAvatarRes } from "@/dto/live.ts";
import { genScreenAvatar } from "../-sql/avatar.ts";
import { redisPool } from "@ijia/data/cache";

let screenAvatarCache: Promise<{ data: string; zeroMs?: number }> | undefined;
export default routeGroup.create({
  method: "GET",
  routePath: "/live/screen/avatar",
  async handler(input, ctx) {
    ctx.header("Content-Type", "application/json");

    if (!screenAvatarCache) {
      screenAvatarCache = getScreenAvatarTryCache().finally(() => {
        screenAvatarCache = undefined;
      });
    }
    const { data, zeroMs } = await screenAvatarCache;
    if (zeroMs) ctx.header("Cache-Control", `public, max-age=${Math.floor(zeroMs / 1000)}`);
    return data;
  },
});

async function getScreenAvatarTryCache(): Promise<{ data: string; zeroMs?: number }> {
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
function getZeroMs(): number {
  const now = new Date();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return tomorrow.getTime() - now.getTime();
}
