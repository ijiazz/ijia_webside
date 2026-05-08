export const BUILD_TIME: Date = new Date(__APP_BUILD_TIME ?? 0);
export const RELEASE_VERSION = "V" + BUILD_TIME.toISOString();

export const IS_ONLINE_HOSTNAME =
  (typeof window !== "undefined" && window.location.hostname === "ijiazz.cn") ||
  window.location.hostname.endsWith(".ijiazz.cn");
