import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import legacy from "@vitejs/plugin-legacy";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import process from "node:process";
import { buildTimePlugin } from "./build/vitest-pulgins.ts";

const API_ORIGIN = process.env.API_ORIGIN || "http://localhost:3000";
const buildTime = Date.now();

//@ts-ignore deno
const rootDir: string = import.meta.dirname!;

export default defineConfig((info) => {
  return {
    root: rootDir,
    server: {
      proxy: {
        "/api/": { target: API_ORIGIN, secure: false, changeOrigin: true },
        "/file/": { target: API_ORIGIN, secure: false, changeOrigin: true },
        "/version.json": {
          async fetch() {
            return Response.json({ nextVersion: new Date(buildTime).toISOString() });
          },
          target: API_ORIGIN,
        },
      },
      host: "localhost",
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
      buildTimePlugin({ nextVersion: buildTime }),
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
          index: rootDir + "/index.html",
          ssr_client: rootDir + "/ssr.html",
        },
      },
    },
  };
});
