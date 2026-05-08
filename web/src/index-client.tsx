import { hydrateRoot } from "react-dom/client";
import { RouterClient } from "@tanstack/react-router/ssr/client";
import { SsrRootWarp, router } from "./common/router.tsx";
import * as sentry from "@sentry/react";
import "./index-client-entry.ts";

console.log("应用运行于 SSR 模式");
const mountApp = () => {
  hydrateRoot(
    document,
    <SsrRootWarp>
      <RouterClient router={router} />
    </SsrRootWarp>,
    {
      onCaughtError: sentry.reactErrorHandler(),
      onUncaughtError: sentry.reactErrorHandler(),
      onRecoverableError: sentry.reactErrorHandler(),
    },
  );
};

mountApp();
