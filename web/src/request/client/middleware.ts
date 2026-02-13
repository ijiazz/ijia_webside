import { goRedirectLoginPath } from "@/app.ts";
import { HoContext, HoResponse } from "@asla/hofetch";

export async function errorHandler(ctx: HoContext, next: () => Promise<HoResponse>) {
  if (ctx.allowFailed === true || ctx[IGNORE_ERROR_MSG]) return next();
  const res = await next();
  if (res.ok) return res;
  if (ctx.allowFailed instanceof Array && ctx.allowFailed.includes(res.status)) return res;

  const body = await res.parseBody();
  const apiErrorEvent = new ApiErrorEvent(ctx, res, body);
  const isUnhandled = apiEvent.dispatchEvent(apiErrorEvent);
  if (isUnhandled) {
    const redirect = apiErrorEvent.getRedirect();
    if (redirect) {
      window.location.assign(redirect);
      console.info("全局 http 拦截器重定向到登录页：", redirect, `原因： ${ctx.url}`);
    }
  }

  return res;
}
export const IGNORE_ERROR_MSG = Symbol("ignore error message");
export const IGNORE_UNAUTHORIZED_REDIRECT = Symbol("ignore unauthorized redirect");

export const apiEvent = new EventTarget();

export enum ApiEvent {
  error = "error",
  alert = "alert",
}
export class ApiErrorEvent extends Event {
  constructor(
    readonly ctx: HoContext,
    readonly response: HoResponse,
    public body?: unknown,
  ) {
    super(ApiEvent.error);
  }
  #err?: { message?: string; code?: string };
  #getError() {
    if (!this.#err) {
      this.#err = getResponseErrorInfo(this.body);
    }
    return this.#err;
  }
  getMessage(): string | number | undefined {
    const err = this.#getError();
    if (err) {
      const isHtml = this.response.headers.get("content-type")?.startsWith("text/html");
      if (err.message && !isHtml) return err.message;
      else return this.response.status;
    }
  }
  getRedirect(): string | undefined {
    if (this.response.status === 401 && !this.ctx[IGNORE_UNAUTHORIZED_REDIRECT]) {
      const err = this.#getError();
      if (err?.code === "REQUIRED_LOGIN") {
        return goRedirectLoginPath();
      }
    }
  }
}
export function isHttpErrorCode(err: any, code: string | number) {
  return typeof err === "object" && err.code === code;
}

export function getResponseErrorInfo(body: unknown): { message?: string; code?: string } | undefined {
  switch (typeof body) {
    case "string":
      return { message: body };
    case "object": {
      if (body === null) return;
      return body;
    }
    default:
      break;
  }
  return;
}
export class MaintenanceEvent extends Event {
  static maintenance: string | null;
  static parseMessage(maintenance: string | null): string | null {
    const range = this.#parseMaintenanceRange(maintenance);
    if (range) {
      const { from, to } = range;

      const now = Date.now();
      if (to.getTime() > now) {
        const toStr = this.#dateToString(to);
        if (from && now < from.getTime()) {
          const fromStr = this.#dateToString(from);
          return `IJIA学院网站将在 ${fromStr} ~ ${toStr} 停机维护`;
        } else {
          return `IJIA学院网站维护中，预计 ${toStr} 恢复正常, 在这之前访问本站可能会出现异常`;
        }
      }
    }
    return null;
  }

  /** 返回格式 YYYY年MM月DD日HH:mm */
  static #dateToString(date: Date): string {
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }
  /**
   * range格式：两个已“/”分隔的 ISO 时间
   *
   * : */
  static #parseMaintenanceRange(range?: string | null): { from?: Date; to: Date } | null {
    if (!range) return null;
    const res = range.split("/");
    if (res.length > 2) return null;
    const [from, to] = res;
    const fromDate = from ? new Date(from) : undefined;
    const toDate = new Date(to);
    if ((fromDate && isNaN(fromDate.getTime())) || isNaN(toDate.getTime())) return null;

    return {
      from: fromDate,
      to: toDate,
    };
  }

  constructor(readonly message: string) {
    super(ApiEvent.alert);
  }
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
