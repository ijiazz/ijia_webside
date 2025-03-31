import fs from "node:fs/promises";
import path from "node:path";
import { AppConfig, checkConfig } from "./config_check.ts";
import * as jsonc from "@std/jsonc";
import { ENV } from "./env.ts";
import { getCheckTypeErrorReason } from "@asla/wokao";

export function getPackageJson() {
  return import("../../package.json", { with: { type: "json" } }).then((mod) => mod.default);
}
const rootDir = path.resolve(import.meta.dirname, "../..");
const configFilePath = path.join(rootDir, "config.jsonc");

class Watcher {
  constructor() {}
  private abc?: AbortController;
  close() {
    this.abc?.abort();
    this.abc = undefined;
  }
  listen() {
    if (this.abc) return;
    this.abc = new AbortController();
    this.watch(this.abc.signal).catch(() => {});
  }
  private async watch(signal: AbortSignal) {
    let timer: number | NodeJS.Timeout | undefined;
    for await (const info of fs.watch(configFilePath, { signal: signal })) {
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
}

export const constWatcher = new Watcher();
export let appConfig: AppConfig = await readConfig().then((res) => {
  if (ENV.WATCH_CONFIG) {
    console.log("监听配置文件变化");
    constWatcher.listen();
  }
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

  try {
    return checkConfig(jsonc.parse(configFile));
  } catch (error) {
    console.error(getCheckTypeErrorReason(error));
    throw error;
  }
}
export type { AppConfig, EmailConfig } from "./config_check.ts";
