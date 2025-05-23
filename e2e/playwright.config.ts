import { defineConfig } from "@playwright/test";
import process from "process";
export const env = {
  WEB_URL: process.env.WEB_URL || "http://localhost:5173",
  DATABASE_URL: process.env.DATABASE_URL || "pg://postgres@localhost:5432/ijia_test",
};

export default defineConfig({
  testDir: ".",
  workers: 1,
  use: {
    browserName: "chromium",
  },
  outputDir: "temp",
  timeout: 10000,
  testIgnore: [/benchmark/],
});
