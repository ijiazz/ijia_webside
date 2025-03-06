import { createClient, RedisClientType } from "@redis/client";
import { ENV } from "@/global/config.ts";
import { ResourcePool } from "evlib/async";
let url = ENV.REDIS_CONNECT_URL;
export class RedisPool {
  constructor(url?: string) {
    this.#url = url ? new URL(url) : undefined;
    this.#pool = new ResourcePool<RedisClientExtra>(
      {
        create: async () => {
          const url = this.url;
          const client = createClient({
            username: url.username || undefined,
            password: url.password || undefined,
            database: +url.pathname.slice(1) || undefined,
          }) as RedisClientExtra;

          Reflect.set(client, "release", () => this.#pool.release(client));
          Reflect.set(client, Symbol.dispose, function (this: RedisPoolConnection) {
            return this.release();
          });
          const onErrorAfterConnect = () => {
            this.#pool.remove(client);
          };
          return new Promise<RedisClientExtra>(function (resolve, reject) {
            client.once("error", reject);
            //TODO 测试 redis connect 方法的行为
            return client.connect().then(() => {
              resolve(client);
              client.off("error", reject);
              client.once("error", onErrorAfterConnect);
            }, reject);
          });
        },
        dispose(conn) {
          conn.disconnect().catch((e) => {
            console.error("redis连接断开失败", e);
          });
        },
      },
      { maxCount: 10 },
    );
  }
  #pool: ResourcePool<RedisClientType>;
  connect(): Promise<RedisPoolConnection> {
    return this.#pool.get() as Promise<any>;
  }
  close(force?: boolean) {
    return this.#pool.close(force);
  }
  #url?: URL;
  get url(): URL {
    if (!this.#url) {
      this.#url = new URL("redis://127.0.0.1:6379");
      console.warn("未配置 REDIS_CONNECT_URL 环境变量, 将使用默认值：" + url);
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
export const redisPool = new RedisPool();

export type RedisPoolConnection = Omit<RedisClientType, "duplicate" | "connect" | "disconnect" | "ref" | "unref"> & {
  release(): void;
  [Symbol.dispose](): void;
};
type RedisClientExtra = RedisClientType & {
  release(): void;
  [Symbol.dispose](): void;
};
