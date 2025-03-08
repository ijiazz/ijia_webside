import { defineConfig } from "@playwright/test";
import config, { env } from "./playwright.config.ts";

env.webUrl = "http://localhost:9002";

export default defineConfig({
  ...config,
  use: {
    browserName: "chromium",
  },
  maxFailures: 1,
  testIgnore: [/tests/],
});
