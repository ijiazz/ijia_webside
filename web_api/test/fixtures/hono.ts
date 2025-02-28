import { createHonoApp, createHono } from "@/modules/serve.ts";
import { Hono } from "hono";
import { test as viTest, DbContext } from "./db_connect.ts";
import { HoFetch, createFetchSuite, InferFetchSuite } from "@asla/hofetch";
import { ApiDefined } from "@/api.ts";
interface HonoContext {
  hono: Hono;
  api: InferFetchSuite<ApiDefined>;
}
let honoApp: ReturnType<typeof createHonoApp> | undefined;
export const test = viTest.extend<HonoContext>({
  async hono({ ijiaDbPool }, use) {
    if (!honoApp) {
      honoApp = createHono();
    }
    const hono = await honoApp;
    await use(hono);
  },
  async api({ hono }, use) {
    const hoFetch = new HoFetch({ fetch: async (req) => hono.fetch(req), defaultOrigin: "http://127.0.0.1" });
    const api = createFetchSuite<ApiDefined>(hoFetch);
    return use(api);
  },
});

export type Context = DbContext & HonoContext;
