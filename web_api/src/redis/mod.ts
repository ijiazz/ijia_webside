import { createClient, RedisClientType } from "@redis/client";
import { ENV } from "@/config/mod.ts";

let redis: RedisClient | undefined;
export function getRedis(): RedisClient {
  if (!redis) {
    let url = ENV.REDIS_CONNECT_URL;
    if (!url) {
      url = "redis://127.0.0.1:6379";
      console.warn("未配置 REDIS_CONNECT_URL 环境变量, 将使用默认值：" + url);
    }
    redis = createClient({ url: ENV.REDIS_CONNECT_URL });
    redis.connect().then(
      () => {
        console.error("redis已连接");
      },
      (e) => {
        console.error("redis连接失败", e);
      },
    );
  }
  return redis;
}
export type RedisClient = RedisClientType;
