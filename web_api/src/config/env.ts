import process from "node:process";

const env = process.env;

export enum RunMode {
  Test = "TEST",
  E2E = "E2E",
  Dev = "DEV",
  Prod = "PROD",
}
const MODE: RunMode = Boolean(env.VITEST) ? RunMode.Test : ((env.MODE ?? RunMode.Dev) as RunMode);
function getJwtKey() {
  if (env.JWT_KEY) return env.JWT_KEY;

  if (MODE === RunMode.Dev) {
    console.warn("DEV 模式下未设置 JWT_KEY, 将使用固定值");
    return "123";
  }
  return crypto.randomUUID();
}
export const ENV = {
  IS_TEST: [RunMode.E2E, RunMode.Test].includes(MODE),
  IS_PROD: MODE === RunMode.Prod,
  MODE,
  OOS_ROOT_DIR: env.OOS_ROOT_DIR,
  CHECK_SERVER: env.CHECK_SERVER,
  WATCH_CONFIG: !!env.WATCH_CONFIG,
  JWT_KEY: getJwtKey(),

  REDIS_CONNECT_URL: env.REDIS_CONNECT_URL,
  ...getListen(),
};
function getListen(): { LISTEN_ADDR: string; LISTEN_PORT: number } {
  const listen = env.LISTEN;
  if (!listen) return { LISTEN_ADDR: "127.0.0.1", LISTEN_PORT: 3000 };
  const [addr, portStr] = listen.split(":");
  const port = +portStr;
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error("'LISTEN'环境变量无效");
  }
  return {
    LISTEN_ADDR: addr,
    LISTEN_PORT: port,
  };
}
