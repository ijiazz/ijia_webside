import { QueryClient } from "@tanstack/react-query";
import { createFetchSuite, FetchSuiteBase, HoFetch, InferFetchSuite } from "@asla/hofetch";
import { ApiDefined } from "@/api.ts";
import { errorHandler, alert } from "./client/middleware.ts";

export * from "./client/middleware.ts";

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
export type Api = {
  [x: string]: FetchSuiteBase;
} & InferFetchSuite<ApiDefined>;

export const API_PREFIX = "/api";
export const http = new HoFetch({ bodyParser: {} });
export const api: Api = createFetchSuite<ApiDefined>(http, { basePath: API_PREFIX });

http.use(errorHandler);
http.use(alert);

export function toFileUrl(path?: undefined | null): undefined;
export function toFileUrl(path: string): string;
export function toFileUrl(path?: string | null): string | undefined;
export function toFileUrl(path?: string | null): string | undefined {
  if (!path) return;
  if (path.startsWith("/")) path = path.slice(1);
  return `${location.origin}/${path}`;
}
