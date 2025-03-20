import fs from "node:fs/promises";
import path from "node:path";
import { AppConfig, checkConfig } from "./config_check.ts";
import * as jsonc from "@std/jsonc";

export function getPackageJson() {
  return import("../../package.json", { with: { type: "json" } }).then((mod) => mod.default);
}
const rootDir = path.resolve(import.meta.dirname, "../..");
const configFilePath = path.join(rootDir, "config.jsonc");

export let appConfig: AppConfig = await readConfig().then((res) => {
  watch();
  return res;
});

export function updateConfig(): Promise<AppConfig> {
  return readConfig().then((config) => {
    appConfig = config;
    return config;
  });
}

async function readConfig(): Promise<AppConfig> {
  let configFile: string;
  try {
    configFile = await fs.readFile(configFilePath, "utf-8");
  } catch (error) {
    console.error(`Failed to read config file at ${configFilePath}:`, error);
    return checkConfig({});
  }

  return checkConfig(jsonc.parse(configFile));
}
export type { AppConfig, EmailConfig } from "./config_check.ts";

async function watch() {
  let timer: number | NodeJS.Timeout | undefined;

  for await (const info of fs.watch(configFilePath)) {
    if (info.eventType === "change") {
      if (timer !== undefined) continue;
      timer = setTimeout(() => {
        timer = undefined;
        updateConfig().then(
          () => {
            console.log("配置文件更新");
          },
          (e) => {
            console.error("配置文件更新失败", e);
          },
        );
      }, 1000);

      //@ts-ignore
      if (typeof globalThis.Deno === "object") Deno.unrefTimer(timer);
      else timer.unref();
    }
  }
}
