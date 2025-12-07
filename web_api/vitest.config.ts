import type { ViteUserConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import process from "node:process";

const PG_URL = process.env.PG_URL || "pg://postgres@127.0.0.1:5432/postgres";
const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";

export default {
  esbuild: { target: "es2024" },
  test: {
    env: {
      TEST_LOGIN_DB: PG_URL,
      TEST_REDIS_RUL: REDIS_URL,
      IJIA_TEMPLATE_DBNAME: "test_ijia_template",
      SIGNUP_VERIFY_EMAIL: "true",
    },

    include: ["./test/**/*.test.ts"],
    setupFiles: ["./test/asserts/asserts.ts"],
  },
  plugins: [tsconfigPaths({})],
} satisfies ViteUserConfig;
