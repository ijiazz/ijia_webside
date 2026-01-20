import path from "node:path";
import { fileURLToPath } from "node:url";

export class PnpmNodeModulesParser {
  constructor(public dotPnpm: string) {
    this.dotPnpm = path.resolve(dotPnpm);
  }
  parserId(id: string) {
    id = path.resolve(id);
    if (id.startsWith(this.dotPnpm)) {
      const rel = id.slice(this.dotPnpm.length);
      const matchResult = rel.match(/^[\\\/](?<name>@?[^@]+)@(?<version>[^\\\/@]+)/);
      if (!matchResult) return;
      return {
        name: matchResult[1].replace("+", "/"),
        version: matchResult[2],
      };
    }
    return undefined;
  }
}
export function getPnpmNodeModulesDir(mod: string) {
  const viteUrl = import.meta.resolve(mod);
  const pnpmUrl = viteUrl.replace(/(?<=\.pnpm)\/vite.+$/, "");
  if (pnpmUrl === viteUrl) {
    throw new Error("无法解析模块 " + mod + " 的 pnpm 目录");
  }
  return fileURLToPath(pnpmUrl).replaceAll("\\", "/");
}
