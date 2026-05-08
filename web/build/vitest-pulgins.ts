import { Plugin } from "vite";
import path from "node:path";
import { PnpmNodeModulesParser, getPnpmNodeModulesDir } from "./vite-tool.ts";

export function buildTimePlugin(option: { buildTime: number }): Plugin {
  const { buildTime } = option;
  const buildTimeStr = new Date(buildTime).toISOString();
  return {
    name: "build-time-plugin",
    buildEnd() {
      this.emitFile({
        type: "asset",
        fileName: "version.json",
        name: "version.json",
        source: JSON.stringify({ buildTime: buildTimeStr }),
      });
      this.info("build version: " + buildTimeStr);
    },
  };
}
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
    "@emotion/css": true,
    "@asla/hofetch": true,
    "@sentry/react": true,
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
export const manualChunks = createManualChunks();

export function ssrRenderProxy(): Plugin {
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
