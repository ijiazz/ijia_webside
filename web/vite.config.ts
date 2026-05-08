import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import legacy from "@vitejs/plugin-legacy";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import process from "process";
import { buildTimePlugin, manualChunks } from "./build/vitest-pulgins.ts";

const origin = "http://localhost:3000";
const buildTime = Date.now();

export default defineConfig({
  root: import.meta.dirname,
  server: {
    proxy: {
      "/api/": { target: origin, secure: false, changeOrigin: true },
      "/file/": { target: origin, secure: false, changeOrigin: true },
      "/version.json": {
        async fetch() {
          return Response.json({ nextVersion: new Date(buildTime).toISOString() });
        },
        target: origin,
      },
    },
  },
  resolve: {
    tsconfigPaths: true,
  },
  define: {
    __APP_BUILD_TIME: JSON.stringify(buildTime),
  },
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: false,
      addExtensions: true,
    }),
    react(),
    buildTimePlugin({ buildTime }),
    legacy({
      renderLegacyChunks: false,
      polyfills: false,

      renderModernChunks: true,
      modernPolyfills: true,
      modernTargets: "defaults",
    }),
    sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      sourcemaps: {
        filesToDeleteAfterUpload: "all",
      },
      release: {
        name: "V" + new Date(buildTime).toISOString(),
      },
    }),
  ],
  build: {
    outDir: "dist/client",
    manifest: true,
    minify: true,
    sourcemap: true,
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
});
