import { createRoot } from "react-dom/client";
import { router } from "./common/router.tsx";
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
mountApp();
