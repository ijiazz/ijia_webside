import { getRedis } from "@/redis/mod.ts";

export class SessionManager<T extends object> {
  constructor(
    readonly keyPrefix: string,
    readonly expire: number,
  ) {}
  private createSessionId() {
    return crypto.randomUUID().replaceAll("-", "");
  }
  async set(value: T, option: { sessionId?: string; EX?: number } = {}): Promise<string> {
    const { EX = this.expire, sessionId } = option;
    const redis = getRedis();
    const data = JSON.stringify(value);

    if (sessionId) {
      await redis.set(this.keyPrefix + ":" + sessionId, data, { EX });
      return sessionId;
    } else {
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
  }
  async get(key: string): Promise<T | undefined> {
    const redis = getRedis();
    const value = await redis.get(this.keyPrefix + ":" + key);
    if (!value) return undefined;
    return JSON.parse(value);
  }
  async delete(key: string): Promise<boolean> {
    const num = await getRedis().del(this.keyPrefix + ":" + key);
    return num > 0;
  }
}
