import process from "node:process";

const env = process.env;
export const ENV = {
  IS_DEV: env.MODE === "DEV",
  OOS_DIR: env.OOS_DIR,
  CHECK_SERVER: env.CHECK_SERVER,
  JWT_KEY: env.JWT_KEY,
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
export function getPackageJson() {
  return import("../../package.json", { with: { type: "json" } }).then((mod) => mod.default);
}
