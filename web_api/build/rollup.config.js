//@ts-check
import { defineConfig } from "rollup";
import esmTsPlugin from "@rollup/plugin-typescript";
import path from "node:path";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import packageJson from "../package.json" with { type: "json" };

const root = path.resolve(import.meta.dirname, "..");
const sourceRoot = path.join(root, "src");
const deps = Object.keys(packageJson.dependencies);

/** @type {any} */
const typescriptPlugin = esmTsPlugin;
export default defineConfig({
  input: { main: "src/main.ts", dto: "src/dto.ts" },
  output: {
    format: "es",
    dir: "dist",
    sourcemap: true,
    sourcemapExcludeSources: true,
    preserveModules: true,
  },
  plugins: [
    typescriptPlugin({
      compilerOptions: {
        module: "NodeNext",
        target: "es2023",
        baseUrl: root,
        rootDir: "./src",
        outDir: "dist",
        noEmit: false,
        declaration: true,
        declarationDir: "./dist",
      },
    }),
    // nodeResolve({ resolveOnly: [] }),
  ],
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
});
