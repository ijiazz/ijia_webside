import type { UserConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import react from "@vitejs/plugin-react";
import legacy from "@vitejs/plugin-legacy";
import { ManualChunkMeta } from "rollup";
import { getPnpmNodeModulesDir, PnpmNodeModulesParser } from "./build/vite-tool.ts";

export default {
  root: import.meta.dirname,
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3000",
        rewrite: (path) => path.replace(/^\/api\//, "/"),
      },
      "/file": { target: "http://127.0.0.1:3000" },
    },
  },
  plugins: [
    tsconfigPaths(),
    react(),
    legacy({
      renderLegacyChunks: false,
      polyfills: false,

      renderModernChunks: true,
      modernPolyfills: true,
      modernTargets: "defaults",
    }),
  ],
  build: {
    target: "es2018",
    rollupOptions: {
      output: {
        manualChunks: createManualChunks(),
      },
    },
  },
} satisfies UserConfig;

function createManualChunks() {
  const pnpmNodeModulesDir = getPnpmNodeModulesDir("vite");
  if (!pnpmNodeModulesDir) return;
  const pnpmParser = new PnpmNodeModulesParser(pnpmNodeModulesDir);
  console.log("pnpm dir", pnpmNodeModulesDir);

  const chunkDeps: Record<string, string | boolean> = {
    // react: true, // 有bug，暂时不要分
    "react-dom": true,
    "react-router": true,
    "@emotion/styled": "emotion",
  };
  const manualChunks = (id: string, meta: ManualChunkMeta) => {
    const modInfo = pnpmParser.parserId(id);
    if (modInfo) {
      const chunk = chunkDeps[modInfo.name];
      // id 是依赖
      if (chunk) {
        if (typeof chunk === "string") return chunk;
        else return modInfo.name;
      }
    }
  };
  return manualChunks;
}
