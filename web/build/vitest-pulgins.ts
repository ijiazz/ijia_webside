import { Plugin } from "vite";

export function buildTimePlugin(option: { nextVersion: number }): Plugin {
  const { nextVersion } = option;
  const buildTimeStr = new Date(nextVersion).toISOString();
  return {
    name: "build-time-plugin",
    buildEnd() {
      this.emitFile({
        type: "asset",
        fileName: "version.json",
        name: "version.json",
        source: JSON.stringify({ nextVersion: buildTimeStr }),
      });
      this.info("build nextVersion: " + buildTimeStr);
    },
  };
}

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
