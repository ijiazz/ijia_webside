import { PlaywrightTestConfig } from "@playwright/test";
import process from "node:process";
import path from "node:path";
const IS_CI = !!process.env.CI;
export const env = {
  WEB_URL: process.env.WEB_URL || "http://localhost:5173",
  DATABASE_URL: process.env.DATABASE_URL || "pg://postgres@localhost:5432/ijia_test",
  API_ORIGIN: process.env.API_ORIGIN || "http://127.0.0.1:3000",
};

const WEB_DIR = path.resolve("../web");
const DEV_CONFIG = {
  testDir: ".",
  workers: 3,
  use: {
    browserName: "chromium",
    actionTimeout: 5000,
    navigationTimeout: 10000,
  },

  outputDir: "temp",
  timeout: 20000,
  expect: {
    timeout: 5000, // 设置全局断言超时时间为5秒
  },
  globalSetup: ["./setup/setup.ts"],
  testIgnore: [/benchmark/],
} satisfies PlaywrightTestConfig;

const CI_CONFIG = {
  ...DEV_CONFIG,
  use: undefined,
  reporter: "html",
  maxFailures: 10,

  webServer: {
    command: "pnpm preview",
    env: {
      API_ORIGIN: env.API_ORIGIN,
    },
    cwd: WEB_DIR,
    url: env.WEB_URL,
  },
  projects: [
    {
      name: "Chrome",
      use: {
        browserName: "chromium",
      },
    },
    // CI 的 webkit 总是出现测试失败，暂时不使用
    /* ,
    {
      name: "WebKit",
      use: {
        browserName: "webkit",
      },
    }, */
  ],
} satisfies PlaywrightTestConfig;

const config = IS_CI ? CI_CONFIG : DEV_CONFIG;
export default config;
