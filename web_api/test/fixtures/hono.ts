import { createHonoApp } from "@/modules/serve.ts";
import { Hono } from "hono";
import { test as viTest } from "./db_connect.ts";
import { HoFetch, createFetchSuite, InferFetchSuite } from "@asla/hofetch";
import { ApiDefined } from "@/api.ts";

export interface Context {
  hono: Hono;
  api: InferFetchSuite<ApiDefined>;
}
let honoApp: ReturnType<typeof createHonoApp> | undefined;
export const test = viTest.extend<Context>({
  async hono({ ijiaDbPool }, use) {
    if (!honoApp) {
      honoApp = createHonoApp();
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
