import { createHono } from "@/bootstrap/hono_app.ts";
import { Hono } from "hono";
import { test as viTest, DbContext } from "./db_connect.ts";
import { HoFetch, createFetchSuite, InferFetchSuite, HoFetchStatusError } from "@asla/hofetch";
import { ApiDefined, REQUEST_AUTH_KEY } from "@/dto.ts";
import type { TestAPI } from "@ijia/api-types/test";

type ApiType = ApiDefined & TestAPI;
export type Api = InferFetchSuite<ApiType>;
interface HonoContext {
  hono: Hono;
  hoFetch: HoFetch;
  api: Api;
}
export const JWT_TOKEN_KEY = Symbol("jwt_token");

let api: Api | undefined;
export function getAPI(): Api {
  if (!api) throw new Error("API has not been initialized");
  return api;
}

export const test = viTest.extend<HonoContext>({
  async hono({}, use) {
    const hono = createHono();
    await use(hono);
  },
  async hoFetch({ hono }, use) {
    const hoFetch = new HoFetch({
      fetch: async (url, req) => {
        const result = await hono.fetch(new Request(url, req));
        if (result instanceof Response) return result;
        throw new Error("返回的不是 Response 对象");
      },
      defaultOrigin: "http://127.0.0.1",
      createStatusError(hoResponse) {
        const message = getResponseErrorInfo(hoResponse.bodyData, hoResponse.status);
        if (message) return new HoFetchStatusError(hoResponse, `(${hoResponse.status}) ${message}`);
      },
    });
    hoFetch.use(async function (ctx, next) {
      if (ctx[JWT_TOKEN_KEY]) {
        ctx.headers.set("cookie", `${REQUEST_AUTH_KEY}=` + ctx[JWT_TOKEN_KEY]);
      }
      return next();
    });
    return use(hoFetch);
  },
  async api({ hoFetch }, use) {
    api = createFetchSuite<ApiType>(hoFetch);
    try {
      await use(api);
    } finally {
      api = undefined;
    }
  },
});

export type Context = DbContext & HonoContext;

function getResponseErrorInfo(body: unknown, status: number): string | undefined {
  switch (typeof body) {
    case "string":
      return body;
    case "object": {
      if (body === null) return;
      if (body instanceof ReadableStream) "Unknown response: ReadableStream";
      return JSON.stringify(body);
    }
    default:
      break;
  }
  return;
}
