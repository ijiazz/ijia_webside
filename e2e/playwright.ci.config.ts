import { defineConfig } from "@playwright/test";
import config, { env } from "./playwright.config.ts";

env.webUrl = "http://localhost:9002";

export default defineConfig({
  ...config,
  use: undefined,
  reporter: "html",
  maxFailures: 10,

  projects: [
    {
      name: "Chrome",
      use: {
        browserName: "chromium",
      },
    },
    {
      name: "Firefox",
      use: {
        browserName: "firefox",
      },
    },
    {
      name: "WebKit",
      use: {
        browserName: "webkit",
      },
    },
  ],
});
