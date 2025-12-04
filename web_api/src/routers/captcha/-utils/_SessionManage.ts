import { redisPool } from "@ijia/data/cache";

export class SessionManager<T extends object> {
  constructor(
    readonly keyPrefix: string,
    readonly expire: number,
  ) {}
  private createSessionId() {
    return crypto.randomUUID().replaceAll("-", "");
  }
  async set(value: T, option: { sessionId?: string; EX?: number } = {}): Promise<string> {
    const { EX = this.expire } = option;
    using redis = await redisPool.connect();
    const data = JSON.stringify(value);

    if (option.sessionId) {
      await redis.del(this.keyPrefix + ":" + option.sessionId);
    }
    let sessionId: string;
    for (let i = 0; i < 2; i++) {
      sessionId = this.createSessionId();
      const OK = await redis.set(this.keyPrefix + ":" + sessionId, data, { EX, NX: true });
      if (OK === "OK") {
        return sessionId;
      }
      console.warn("Captcha sessionId 重复");
    }
    return sessionId!;
  }
  async take(key: string): Promise<T | undefined> {
    using redis = await redisPool.connect();
    const value = await redis.getDel(this.keyPrefix + ":" + key);
    if (!value) return undefined;
    return JSON.parse(value);
  }
  async get(key: string): Promise<T | undefined> {
    using redis = await redisPool.connect();
    const value = await redis.get(this.keyPrefix + ":" + key);
    if (!value) return undefined;
    return JSON.parse(value);
  }
  async delete(key: string): Promise<boolean> {
    using redis = await redisPool.connect();
    const num = await redis.del(this.keyPrefix + ":" + key);
    return num > 0;
  }
}
