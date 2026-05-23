import { HoContext, HoResponse } from "@asla/hofetch";

let isRefreshing = false;
export async function authRefresh(ctx: HoContext, next: () => Promise<HoResponse>) {
  const res = await next();

  if (res.headers.get("X-Token-Need-Refresh") && !isRefreshing) {
    refreshToken().finally(() => {
      setTimeout(() => {
        isRefreshing = false;
      }, 60 * 1000);
    });
    isRefreshing = true;
  }

  return res;
}
async function refreshToken() {
  await fetch("/api/passport/refresh_token", { method: "POST", credentials: "include" });
}
