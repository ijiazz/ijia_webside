import { defineConfig } from "@playwright/test";
import config from "./playwright.config.ts";

export default defineConfig({
  ...config,
  use: {
    browserName: "chromium",
  },
  maxFailures: 1,
  testIgnore: [/tests/],
});
