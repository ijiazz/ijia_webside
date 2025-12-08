import { env } from "@/playwright.config.ts";
import { PgDbQueryPool } from "@asla/pg";
import { setDbPoolConnect } from "@ijia/data/query";

export const dbPool = new PgDbQueryPool(() => {
  let url = env.DATABASE_URL;
  if (!url) {
    url = "postgresql://postgres@localhost:5432/ijia_test";
    console.warn("未配置 DATABASE_URL环境变量, 将使用默认值：" + url);
  }
  return url;
});

setDbPoolConnect(dbPool.connect.bind(dbPool));
