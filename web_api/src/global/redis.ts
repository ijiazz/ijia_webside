import { createClient, RedisClientType } from "redis";
import { ENV } from "@/config/mod.ts";

export function getRedis() {
  if (!ENV.REDIS_CONNECT_URL) throw new Error("未配置 REDIS_CONNECT_URL 环境变量");
  return createClient({ url: ENV.REDIS_CONNECT_URL });
}
export type Redis = RedisClientType;
