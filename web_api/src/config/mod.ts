import process from "node:process";

const env = process.env;
export const ENV = {
  IS_DEV: env.MODE === "DEV" || Boolean(env.VITEST),
  OOS_DIR: env.OOS_DIR,
  CHECK_SERVER: env.CHECK_SERVER,
  JWT_KEY: env.JWT_KEY ?? crypto.randomUUID(),

  SIGUP_VERIFY_EMAIL: !!env.SIGUP_VERIFY_EMAIL,
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
