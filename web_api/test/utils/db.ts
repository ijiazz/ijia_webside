import { PgDbQueryPool, DbManage, parserDbConnectUrl } from "@asla/pg";

function getConfigEnv(env: Record<string, string | undefined>) {
  const url = env["TEST_LOGIN_DB"];
  if (!url) throw new Error("缺少 TEST_LOGIN_DB 环境变量");
  return parserDbConnectUrl(url);
}

export const DB_CONNECT_INFO = getConfigEnv(process.env);

const PUBLIC_DB_NAME = "test_ijia_public";

export const PUBLIC_CONNECT_INFO = { ...DB_CONNECT_INFO, database: PUBLIC_DB_NAME };
