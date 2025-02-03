//@ts-check
import { defineConfig } from "rollup";
import tsPlugin from "@rollup/plugin-typescript";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import packageJson from "../package.json" with { type: "json" };

/** @type {any} */
const typescriptPlugin = tsPlugin;
export default defineConfig({
  input: { main: "src/main.ts" },
  output: {
    format: "es",
    dir: "dist",

    preserveModules: true,
  },
  plugins: [
    typescriptPlugin({
      compilerOptions: {
        module: "NodeNext",
        target: "es2023",
        baseUrl: ".",
        rootDir: ".",
        outDir: "dist",
        noEmit: false,
        declaration: true,
      },
    }),
  ],
  external: [/^node\:/],
});
