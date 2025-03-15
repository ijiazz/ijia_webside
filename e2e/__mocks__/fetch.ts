import { HoFetch, createFetchSuite, InferFetchSuite, FetchSuiteBase, HoFetchStatusError } from "@asla/hofetch";
import { ApiDefined } from "@/api.ts";
import { env } from "@/playwright.config.ts";
export type Api = {
  [x: string]: FetchSuiteBase;
} & InferFetchSuite<ApiDefined>;

function createHoFetch() {
  const API_PREFIX = "/api";
  const http = new HoFetch({
    bodyParser: {},
    defaultOrigin: new URL(env.webUrl).origin,
    createStatusError(hoResponse) {
      const body = getResponseErrorInfo(hoResponse.bodyData);
      if (body) return new HoFetchStatusError(hoResponse, hoResponse.status + ": " + (body as any).message);
    },
  });
  const api: Api = createFetchSuite<ApiDefined>(http, {
    basePath: API_PREFIX,
  });
  return { http, API_PREFIX, api };
}
const { http, API_PREFIX, api } = createHoFetch();

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
