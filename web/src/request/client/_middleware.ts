import { HoContext, HoResponse } from "@asla/hofetch";
import { ApiErrorEvent, apiEvent, IGNORE_ERROR_MSG, IGNORE_UNAUTHORIZED_REDIRECT, MaintenanceEvent } from "./event.ts";

export async function errorHandler(ctx: HoContext, next: () => Promise<HoResponse>) {
  if (ctx.allowFailed === true || ctx[IGNORE_ERROR_MSG]) return next();
  const res = await next();
  if (res.ok) return res;
  if (ctx.allowFailed instanceof Array && ctx.allowFailed.includes(res.status)) return res;

  const body = await res.parseBody();
  const apiErrorEvent = new ApiErrorEvent({
    headers: res.headers,
    status: res.status,
    body,
    ignoreUnauthorizedRedirect: ctx[IGNORE_UNAUTHORIZED_REDIRECT],
  });
  const isUnhandled = apiEvent.dispatchEvent(apiErrorEvent);
  if (isUnhandled) {
    const { url: redirect } = apiErrorEvent.getRedirect();
    if (redirect) {
      window.location.assign(redirect);
      console.info("全局 http 拦截器重定向到登录页：", redirect, `原因： ${ctx.url}`);
    }
  }

  return res;
}

export async function alert(ctx: HoContext, next: () => Promise<HoResponse>): Promise<HoResponse> {
  const res = await next();

  /** 格式 ISO/ISO */
  const maintenance = res.headers.get("x-service-maintenance");
  MaintenanceEvent.maintenance = maintenance;
  const message = MaintenanceEvent.parseMessage(maintenance);
  if (message) {
    apiEvent.dispatchEvent(new MaintenanceEvent(message));
  }

  return res;
}
