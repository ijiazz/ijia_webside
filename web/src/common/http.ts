import { HoFetch, createFetchSuite, InferFetchSuite, FetchSuiteBase } from "@asla/hofetch";
import { ApiDefined } from "@/api.ts";

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

export { http, API_PREFIX, api };

export function isHttpErrorCode(err: any, code: string | number) {
  return typeof err === "object" && err.code === code;
}
