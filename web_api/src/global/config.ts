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
  JWT_KEY: getJwtKey(),

  SIGUP_VERIFY_EMAIL_DISABLE: env.SIGUP_VERIFY_EMAIL_DISABLE?.toLowerCase() === "true",
  REDIS_CONNECT_URL: env.REDIS_CONNECT_URL,
  EMAIL_CONFIG: getEmailConfig(),
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
function getEmailConfig(): EmailConfig | undefined {
  const serverUrl = env.EMAIL_SEND_SERVER_URL;
  const sender = env.EMAIL_SENDER;
  if (!serverUrl || !sender) return;
  const result = sender.match(/(.+)\s+\<(.+)\>/);
  if (!result) throw new Error("EMAIL_SENDER 格式不正确");
  const senderName = result[1];
  const senderEmail = result[2];
  let url: URL;
  try {
    url = new URL(serverUrl);
  } catch (error) {
    throw new Error("环境变量 EMAIL_SEND_SERVER_URL 不是有效的 URL");
  }
  if (url.protocol !== "smtps:") throw new Error("EMAIL_SEND_SERVER_URL 只支持 smtps 协议");

  const password = env.EMAIL_SENDER_PASSWORD;
  return {
    senderName,
    senderEmail,
    auth: {
      user: senderEmail,
      password: password,
    },
    serverHost: url.hostname,
    serverPort: +url.port,
  };
}

export type EmailConfig = {
  senderName: string;
  senderEmail: string;

  auth?: { user: string; password?: string };

  serverHost: string;
  serverPort: number;
};
