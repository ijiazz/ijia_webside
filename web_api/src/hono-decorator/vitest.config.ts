import type { ViteUserConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default {
  esbuild: { target: "es2023" },
  test: {
    include: ["./test/**/*.test.ts"],
  },
  plugins: [tsconfigPaths({})],
} satisfies ViteUserConfig;
