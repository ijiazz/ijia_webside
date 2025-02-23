import { Controller, applyController, Get } from "@asla/hono-decorator";
import { Context, Hono } from "hono";
import { expect, test } from "vitest";

test("basePath", async function () {
  @Controller({ basePath: "/api" })
  class Test {
    @Get("/test") handler(ctx: Context) {
      return ctx.text("1");
    }
    @Get("test") method(ctx: Context) {
      return ctx.text("2");
    }
  }
  const hono = new Hono();
  applyController(hono, new Test());

  let res = await hono.request("/api/test");
  expect(res.status).toBe(200);
  await expect(res.text()).resolves.toBe("1");

  res = await hono.request("/apitest");
  expect(res.status).toBe(200);
  await expect(res.text()).resolves.toBe("2");
});
test("Repeated definitions can overwrite previously decorated data", async function () {
  @Controller({ basePath: "/prefix" })
  @Controller({ basePath: "/api" })
  class Test {
    @Get("/test") handler(ctx: Context) {
      return ctx.text("1");
    }
  }
  const hono = new Hono();
  applyController(hono, new Test());

  let res = await hono.request("/api/test");
  expect(res.status).toBe(404);
  res = await hono.request("/prefix/test");
  expect(res.status).toBe(200);
});
