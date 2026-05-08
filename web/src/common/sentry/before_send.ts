import { BrowserOptions } from "@sentry/react";

export const beforeSend: NonNullable<BrowserOptions["beforeSend"]> = function beforeSend(event, hint) {
  return event;
};
