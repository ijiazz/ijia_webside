import { QueryClient } from "@tanstack/react-query";
import { createFetchSuite, FetchSuiteBase, HoFetch, InferFetchSuite } from "@asla/hofetch";
import { ApiDefined, FileAPI } from "@/api.ts";
import { errorHandler, alert } from "./client/_middleware.ts";

export * from "./client/event.ts";
export * from "./client/util.ts";
export * from "./client/upload.ts";

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
type API = {
  [x: string]: FetchSuiteBase;
} & InferFetchSuite<ApiDefined>;

type FileAPISuite = {
  [x: string]: FetchSuiteBase;
} & InferFetchSuite<FileAPI>;

export const API_PREFIX = "/api";
export const http = new HoFetch({ bodyParser: {} });
export const api: API = createFetchSuite<ApiDefined>(http, { basePath: API_PREFIX });
export const fileAPI: FileAPISuite = createFetchSuite<FileAPI>(http);

http.use(errorHandler);
http.use(alert);
