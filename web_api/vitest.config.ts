import type { ViteUserConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import process from "node:process";

const PG_URL = process.env.PG_URL || "pg://test@127.0.0.1:5432/postgres";

export default {
  esbuild: { target: "es2023" },
  test: {
    env: {
      TEST_LOGIN_DB: PG_URL,
      IJIA_TEMPLATE_DBNAME: "test_ijia_template",
    },

    include: ["./test/**/*.test.ts"],
    setupFiles: ["../deps/ijia-data/test/setup/extend_yoursql.ts", "./test/asserts/asserts.ts"],
    globalSetup: "../deps/ijia-data/test/setup/setup_pgsql.ts",
  },
  plugins: [tsconfigPaths({})],
} satisfies ViteUserConfig;
