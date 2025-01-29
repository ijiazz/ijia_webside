import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  root: "./web_main/pages/avatar_flow",
  server: {
    proxy: {
      "/api": { target: "http://127.0.0.1:3000", rewrite: (path) => path.replace(/^\/api\//, "/") },
      "/file": { target: "http://127.0.0.1:3000" },
    },
  },
  plugins: [tsconfigPaths()],
});
