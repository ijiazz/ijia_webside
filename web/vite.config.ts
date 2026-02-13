import type { UserConfig, Plugin } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import react from "@vitejs/plugin-react";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import legacy from "@vitejs/plugin-legacy";

import { getPnpmNodeModulesDir, PnpmNodeModulesParser } from "./build/vite-tool.ts";
import path from "node:path";
const origin = "http://localhost:3000";
export default {
  root: import.meta.dirname,
  server: {
    proxy: {
      "/api/": { target: origin, secure: false, changeOrigin: true },
      "/file/": { target: origin, secure: false, changeOrigin: true },
    },
  },
  plugins: [
    tsconfigPaths(),
    tanstackRouter({
      target: "react",
      autoCodeSplitting: false,
      addExtensions: true,
    }),
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
    minify: true,
    rolldownOptions: {
      input: {
        index: import.meta.dirname + "/index.html",
        // "x/index": import.meta.dirname + "/x/index.html",
        ssr_client: import.meta.dirname + "/ssr.html",
      },
      output: {
        codeSplitting: {
          groups: [
            {
              test: /node_modules/,
              name: (id) => manualChunks(id),
            },
          ],
        },
      },
    },
  },
} satisfies UserConfig;

function createManualChunks() {
  const srcDir = path.resolve(import.meta.dirname, "src");
  const pnpmNodeModulesDir = getPnpmNodeModulesDir("vite");
  const pnpmParser = new PnpmNodeModulesParser(pnpmNodeModulesDir);
  console.log("pnpm dir", pnpmNodeModulesDir);
  console.log("src dir", srcDir);

  const chunkDeps: Record<string, string | boolean> = {
    react: true, // 有bug，暂时不要分
    "react-dom": true,
    "react-hook-form": true,
    "@tanstack/react-router": true,
    "@tanstack/react-query": true,
    "@emotion/styled": true,
    "@emotion/css": true,
    "@jsr/asla__hofetch": "@asla/hofetch",
  };
  const manualChunks = (id: string) => {
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
const manualChunks = createManualChunks();
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
