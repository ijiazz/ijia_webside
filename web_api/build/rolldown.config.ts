import { defineConfig } from "rolldown";
import packageJson from "../package.json" with { type: "json" };

import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const sourceRoot = path.join(root, "src");
const deps = Object.keys(packageJson.dependencies);


export default defineConfig({
  input: { main: "src/main.ts" },
  output: {
    format: "es",
    dir: "dist",
    sourcemap: true,
    sourcemapExcludeSources: true,
    preserveModules: true
  },
  external: (source, importer, isResolved) => {
    if (isResolved) {
      if (!source.startsWith(sourceRoot)) return true;
      return;
    } else {
      if (/^node\:/.test(source)) return true;
      for (const item of deps) {
        if (source.startsWith(item)) return true;
      }
    }
  },
})