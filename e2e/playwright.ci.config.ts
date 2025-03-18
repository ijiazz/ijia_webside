import { defineConfig } from "@playwright/test";
import config from "./playwright.config.ts";

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
