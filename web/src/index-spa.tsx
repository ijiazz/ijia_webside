import { loginByAccessToken } from "@/common/user.ts";
import { createRoot } from "react-dom/client";
import { router } from "./common/router.tsx";
import { REQUEST_AUTH_KEY } from "./api.ts";
import * as sentry from "@sentry/react";
import "./index-client-entry.ts";
import { RouterProvider } from "@tanstack/react-router";

console.log("应用运行于 SPA 模式");
const mountApp = () => {
  createRoot(document.getElementById("app")!, {
    onCaughtError: sentry.reactErrorHandler(),
    onUncaughtError: sentry.reactErrorHandler(),
    onRecoverableError: sentry.reactErrorHandler(),
  }).render(<RouterProvider router={router} />);
};
paseAccessToken();
mountApp();

function paseAccessToken() {
  const url = new URL(location.href);
  const access_token = url.searchParams.get(REQUEST_AUTH_KEY);
  if (access_token) {
    loginByAccessToken(access_token);
    url.searchParams.delete(REQUEST_AUTH_KEY);
    location.replace(url);
  }
}
