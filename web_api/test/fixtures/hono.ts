import { createHono } from "@/modules/serve.ts";
import { Hono } from "hono";
import { test as viTest, DbContext } from "./db_connect.ts";
import { HoFetch, createFetchSuite, InferFetchSuite, HoFetchStatusError } from "@asla/hofetch";
import { ApiDefined } from "@/api.ts";

export type Api = InferFetchSuite<ApiDefined>;
interface HonoContext {
  hono: Hono;
  hoFetch: HoFetch;
  api: Api;
}
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
        const body = hoResponse.bodyData;
        if (typeof body === "object" && !(body instanceof ReadableStream) && typeof (body as any).message === "string")
          return new HoFetchStatusError(hoResponse, hoResponse.status + ": " + (body as any).message);
      },
    });
    return use(hoFetch);
  },
  async api({ hoFetch }, use) {
    return use(createFetchSuite<ApiDefined>(hoFetch));
  },
});

export type Context = DbContext & HonoContext;
