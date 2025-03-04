import { defineConfig } from "@playwright/test";

export const env = {
  web_url: "http://localhost:5173",
  pg_url: "pg://postgres@localhost:5432/ijia_test",
};

export default defineConfig({
  testDir: ".",
  use: {
    browserName: "chromium",
  },
  outputDir: "temp",
  timeout: 10000,
  testIgnore: [/benchmark/],
});
