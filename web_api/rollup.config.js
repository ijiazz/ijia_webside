//@ts-check
import { defineEvConfig } from "@eavid/lib-dev/rollup";
import { isBuiltin } from "node:module";

export default defineEvConfig({
  input: { main: "src/main.ts" },
  output: {
    format: "es",
    dir: "dist",
    manualChunks(modId, meta) {
      if (modId.includes("@nest/")) return "nest";
    },
  },
  plugins: [],
  extra: {
    resolve: true,
    typescript: {
      compilerOptions: {
        module: "NodeNext",
        target: "es2023",
        baseUrl: ".",
        rootDir: "src",
        outDir: "dist",
        noEmit: false,
        declaration: false,
      },
    },
  },
  external: [/^node\:/],
});
