import { hono, setup } from "@/serve.ts";
import { Hono } from "hono";
import { NestHonoApplication } from "nest-hono-adapter";
import { test as viTest } from "vitest";
export interface Context {
  hono: Hono;
}
let nestApp: Promise<NestHonoApplication> | undefined;
export const test = viTest.extend<Context>({
  async hono({}, use) {
    if (!nestApp) {
      nestApp = setup();
    }
    await nestApp;
    await use(hono);
  },
});
