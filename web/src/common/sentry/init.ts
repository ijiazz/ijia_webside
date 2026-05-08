import * as sentry from "@sentry/react";
import { beforeSend as beforeSendHandler } from "./before_send.ts";
import { RELEASE_VERSION } from "../env.ts";

import { User } from "@/api.ts";

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  const enabled = !!dsn;
  if (enabled) {
    console.log("Sentry enabled:", enabled);
  } else {
    console.log("Sentry disabled: Missing DSN");
  }
  sentry.init({
    enabled: enabled,
    dsn: dsn,
    environment: import.meta.env.MODE,
    release: RELEASE_VERSION,
    sendDefaultPii: true,
    integrations: [
      sentry.replayIntegration({
        maskAllText: false,
        maskAllInputs: false,
        blockAllMedia: true,
        networkDetailAllowUrls: [window.location.origin],
        networkRequestHeaders: [],
        networkResponseHeaders: [],
      }),
    ],

    tracesSampleRate: 0.2,

    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    enableLogs: true,

    beforeSend: beforeSendHandler,

    // 意义错误过滤
    ignoreErrors: [],
  });
}

export function setSentryUser(user: User) {
  sentry.setUser({ id: user.user_id.toString(), username: user.nickname });
}
