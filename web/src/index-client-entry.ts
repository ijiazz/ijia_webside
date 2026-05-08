/// <reference types="vite/client" />
import "./styles/global.css";
import { initClarity } from "@/common/clarity.ts";
import { initSentry } from "@/common/sentry.ts";
import { IS_ONLINE_HOSTNAME } from "@/common/env.ts";

if (import.meta.env.PROD && IS_ONLINE_HOSTNAME) {
  initClarity();
  initSentry();
}
