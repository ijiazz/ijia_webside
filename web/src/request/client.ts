import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 0,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      networkMode: "always",
    },
    mutations: {
      retry: false,
      networkMode: "always",
    },
  },
});
import { HoFetch, createFetchSuite, InferFetchSuite, FetchSuiteBase, HoContext, HoResponse } from "@asla/hofetch";
import { ApiDefined } from "@/api.ts";
import { goRedirectLoginPath } from "@/app.ts";

export type Api = {
  [x: string]: FetchSuiteBase;
} & InferFetchSuite<ApiDefined>;

export function createHoFetch() {
  const API_PREFIX = "/api";
  const http = new HoFetch({ bodyParser: {} });
  const api: Api = createFetchSuite<ApiDefined>(http, { basePath: API_PREFIX });

  return { http, API_PREFIX, api };
}
const { http, API_PREFIX, api } = createHoFetch();
export const apiEvent = new EventTarget();

export enum ApiEvent {
  error = "error",
}
export class ApiErrorEvent extends Event {
  constructor(
    readonly ctx: HoContext,
    readonly response: HoResponse,
    public body?: unknown,
  ) {
    super(ApiEvent.error);
  }
}

http.use(async function (ctx, next) {
  if (ctx.allowFailed === true || ctx[IGNORE_ERROR_MSG]) return next();
  const res = await next();
  if (res.ok) return res;
  if (ctx.allowFailed instanceof Array && ctx.allowFailed.includes(res.status)) return res;

  const body = await res.parseBody();
  const isUnhandled = apiEvent.dispatchEvent(new ApiErrorEvent(ctx, res, body));
  if (isUnhandled && res.status === 401) {
    const redirect = goRedirectLoginPath();
    if (redirect) window.location.assign(redirect);
  }

  return res;
});

export { http, API_PREFIX, api };

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

export function toFileUrl(path?: undefined | null): undefined;
export function toFileUrl(path: string): string;
export function toFileUrl(path?: string | null): string | undefined;
export function toFileUrl(path?: string | null): string | undefined {
  if (!path) return;
  if (path.startsWith("/")) path = path.slice(1);
  return `${location.origin}/${path}`;
}
export const IGNORE_ERROR_MSG = Symbol("ignore error message");
export const IGNORE_UNAUTHORIZED_REDIRECT = Symbol("ignore unauthorized redirect");
