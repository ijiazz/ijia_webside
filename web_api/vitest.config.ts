import type { ViteUserConfig } from "vitest/config";
import deno from "@deno/vite-plugin";

export default {
  plugins: [deno()],
  test: {
    include: ["./test/**/*.test.ts"],
    setupFiles: ["./test/asserts/asserts.ts", "./test/setup/db.ts"],
    globalSetup: ["./test/setup/global_setup.ts"],
  },
} satisfies ViteUserConfig;
