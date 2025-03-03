import { createClient, RedisClientType } from "@redis/client";
import { ENV } from "@/global/config.ts";

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
        console.log("redis已连接");
      },
      (e) => {
        console.error("redis连接失败", e);
      },
    );
  }
  return redis;
}
export async function disconnectRedis() {
  if (redis) return redis.disconnect();
}
export function setRedis(redisClient: RedisClientType<any, any, any>) {
  redis = redisClient;
}
export type RedisClient = RedisClientType;
