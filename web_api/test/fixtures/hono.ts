import { createHono } from "@/bootstrap/hono_app.ts";
import { Hono } from "hono";
import { test as viTest, DbContext } from "./db_connect.ts";
import { HoFetch, createFetchSuite, InferFetchSuite, HoFetchStatusError } from "@asla/hofetch";
import { ApiDefined, REQUEST_AUTH_KEY } from "@/dto.ts";

export type Api = InferFetchSuite<ApiDefined>;
interface HonoContext {
  hono: Hono;
  hoFetch: HoFetch;
  api: Api;
}
export const JWT_TOKEN_KEY = Symbol("jwt_token");
export const test = viTest.extend<HonoContext>({
  async hono({}, use) {
    await use(createHono());
  },
  async hoFetch({ hono }, use) {
    const hoFetch = new HoFetch({
      fetch: async (req) => {
        const result = await hono.fetch(req);
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
    return use(createFetchSuite<ApiDefined>(hoFetch));
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
