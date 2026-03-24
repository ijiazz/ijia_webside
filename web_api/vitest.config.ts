import type { ViteUserConfig } from "vitest/config";

const rootDir = import.meta.dirname;
export default {
  resolve: {
    tsconfigPaths: true,
    alias: [
      {
        find: /^@\//,
        replacement: `${rootDir}/src/`,
      },
      {
        find: /^#test\//,
        replacement: `${rootDir}/test/`,
      },
    ],
  },
  test: {
    include: ["./test/**/*.test.ts"],
    setupFiles: ["./test/asserts/asserts.ts", "./test/setup/db.ts"],
    globalSetup: ["./test/setup/global_setup.ts"],
  },
} satisfies ViteUserConfig;
