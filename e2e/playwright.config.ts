import { defineConfig } from "@playwright/test";

export const env = {
  webUrl: "http://localhost:5173",
  pgUrl: "pg://postgres@localhost:5432/ijia_test",
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
