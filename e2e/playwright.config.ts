import { defineConfig } from "@playwright/test";
import process from "process";
export const env = {
  WEB_URL: process.env.WEB_URL || "http://localhost:5173",
  DATABASE_URL: process.env.DATABASE_URL || "pg://postgres@localhost:5432/ijia_test",
};

export default defineConfig({
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
});
