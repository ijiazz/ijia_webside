import fs from "node:fs/promises";
import path from "node:path";
import { AppConfig, checkConfig } from "./config_check.ts";
import * as jsonc from "@std/jsonc";

export function getPackageJson() {
  return import("../../package.json", { with: { type: "json" } }).then((mod) => mod.default);
}
const rootDir = path.resolve(import.meta.dirname, "../..");

export let appConfig: AppConfig = await readConfig();

export function updateConfig(): Promise<AppConfig> {
  return readConfig().then((config) => {
    appConfig = config;
    return config;
  });
}

async function readConfig(): Promise<AppConfig> {
  const configFilePath = path.join(rootDir, "config.jsonc");
  let json: unknown;
  let configFile: string;
  try {
    configFile = await fs.readFile(configFilePath, "utf-8");
  } catch (error) {
    console.error(`Failed to read config file at ${configFilePath}:`, error);
    return checkConfig({});
  }
  try {
    json = jsonc.parse(configFile);
  } catch (error) {
    console.error(`Failed to parse config file at ${configFilePath}:`, error);
    return checkConfig({});
  }
  return checkConfig(json);
}
export type { AppConfig, EmailConfig } from "./config_check.ts";
