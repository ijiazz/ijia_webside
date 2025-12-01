import { signAccessToken } from "@/global/jwt.ts";
import { HonoContext } from "@/hono/type.ts";
import { RouteGroup } from "@/lib/route.ts";

const routeGroup = new RouteGroup<HonoContext>();
export default routeGroup;

export async function signToken(userId: number) {
  const DAY = 24 * 60 * 60; // 一天的秒数
  const jwtKey = await signAccessToken(userId, {
    survivalSeconds: 60 * 60, // 60 分钟过期. 每60分钟需要刷新一次
    refreshKeepAliveSeconds: 7 * DAY, // 7 天内有操作可免登录
    refreshSurvivalSeconds: 30 * DAY, // 刷新 token 最多可以用 1 个月
  });

  return jwtKey;
}
