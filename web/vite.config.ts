import type { UserConfig, Plugin } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import react from "@vitejs/plugin-react";
import legacy from "@vitejs/plugin-legacy";
import { ManualChunkMeta } from "rollup";
import { getPnpmNodeModulesDir, PnpmNodeModulesParser } from "./build/vite-tool.ts";
const origin = "http://127.0.0.1:3000";
export default {
  root: import.meta.dirname,
  server: {
    proxy: {
      "/api/": {
        target: origin,
        rewrite: (path) => path.replace(/^\/api\//, "/"),
      },
      "/file/": { target: origin },
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
    outDir: "dist/client",
    manifest: true,
    rollupOptions: {
      output: {
        manualChunks: createManualChunks(),
      },
      input: {
        index: import.meta.dirname + "/index.html",
        // "x/index": import.meta.dirname + "/x/index.html",
        ssr_client: import.meta.dirname + "/ssr.html",
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
        if (typeof chunk === "string") return "deps/" + chunk;
        else return "deps/" + modInfo.name;
      }
    }
  };
  return manualChunks;
}
function ssrRenderProxy(): Plugin {
  return {
    name: "ssr-proxy",
    transformIndexHtml: async (html, ctx) => {
      const base = ctx.originalUrl ?? "/";
      const res = await fetch(`http://localhost:5273${base}`);
      if (res.status !== 200) {
        console.error("SSR error", res.status, base);
        return html;
      }
      const text = await res.text();
      return html.replace("<!--SSR-ELEMENT-->", text);
    },
  };
}
