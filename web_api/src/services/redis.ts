import { ENV } from "@/config.ts";
import { createClient, RedisClientType } from "@redis/client";
import { ResourcePool } from "evlib/async";
export class RedisPool {
  constructor(url: string | URL | (() => string | URL)) {
    if (typeof url === "function") this.#getUrl = url;
    else {
      this.#url = new URL(url);
    }
    this.#pool = new ResourcePool<RedisClientExtra>(
      {
        create: () => {
          const client = createClient({
            url: this.url.toString(),
            disableOfflineQueue: true,
            socket: { reconnectStrategy: false },
          }) as RedisClientExtra;

          Reflect.set(client, "release", () => this.#pool.release(client));
          Reflect.set(client, Symbol.dispose, function (this: RedisPoolConnection) {
            return this.release();
          });
          const onErrorAfterConnect = (e: any) => {
            console.log("出错了", e);

            this.#pool.remove(client);
          };
          return new Promise<RedisClientExtra>(function (resolve, reject) {
            const onError = (e: any) => {
              reject(new Error("Redis 连接失败", { cause: e }));
            };
            client.once("error", onError);
            return client.connect().then(() => {
              resolve(client);
              client.off("error", onError);
              client.on("error", onErrorAfterConnect);
            }, reject);
          });
        },
        dispose(conn) {
          conn.destroy();
        },
      },
      { maxCount: 10, idleTimeout: 5000, usageLimit: 9999 },
    );
  }
  #pool: ResourcePool<RedisClientType>;
  connect(): Promise<RedisPoolConnection> {
    return this.#pool.get() as Promise<any>;
  }
  close(force?: boolean) {
    return this.#pool.close(force);
  }
  #getUrl?: () => string | URL;
  #url?: URL;
  get url(): URL {
    if (!this.#url) {
      this.#url = new URL(this.#getUrl!());
    }
    return this.#url;
  }
  set url(url: URL) {
    this.#url = url;
  }
  get totalCount() {
    return this.#pool.totalCount;
  }
  get idleCount() {
    return this.#pool.idleCount;
  }
}

export type RedisPoolConnection = Omit<RedisClientType, "duplicate" | "connect" | "disconnect" | "ref" | "unref"> & {
  release(): void;
  [Symbol.dispose](): void;
};
type RedisClientExtra = RedisClientType & {
  release(): void;
  [Symbol.dispose](): void;
};

export const redisPool = new RedisPool(() => {
  let url = ENV.REDIS_CONNECT_URL;
  if (!url) {
    url = "redis://127.0.0.1:6379";
    console.warn("未配置 REDIS_CONNECT_URL 环境变量, 将使用默认值：" + url);
  }
  return url;
});
