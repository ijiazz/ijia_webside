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
    // CI 的 webkit 总是出现测试失败，暂时不使用
    /* ,
    {
      name: "WebKit",
      use: {
        browserName: "webkit",
      },
    }, */
  ],
});
