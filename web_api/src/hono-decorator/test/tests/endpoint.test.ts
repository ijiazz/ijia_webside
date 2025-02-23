import { test, expect } from "vitest";
import { Endpoint, applyController, DecoratorKindError } from "@asla/hono-decorator";
import { Context, Hono } from "hono";

test("Use an Endpoint to set the GET route", async function () {
  class Controller {
    @Endpoint("/test", "GET") method(ctx: Context) {
      return ctx.text("method");
    }
    @Endpoint("/handler", "GET") handler = (ctx: Context) => {
      return ctx.text("handler");
    };
  }

  const hono = new Hono();
  applyController(hono, new Controller());

  let res = await hono.request("/test");
  expect(res.status).toBe(200);
  await expect(res.text()).resolves.toBe("method");

  res = await hono.request("/handler");
  expect(res.status).toBe(200);
  await expect(res.text()).resolves.toBe("handler");
});
test("Use an endpoint to set routes for all methods", async function () {
  class Controller {
    @Endpoint("/test") test(ctx: Context) {
      return ctx.text(ctx.req.method);
    }
  }

  const hono = new Hono();
  applyController(hono, new Controller());

  let response = await hono.request("/test");
  expect(response.status).toBe(200);

  await expect(response.text()).resolves.toBe("GET");

  response = await hono.request("/test", { method: "POST" });
  expect(response.status).toBe(200);
  await expect(response.text()).resolves.toBe("POST");
});
test("A handler can apply multiple Endpoint()", async function () {
  class Controller {
    @Endpoint("/test2")
    @Endpoint("/test1")
    handler(ctx: Context) {
      return ctx.body(null);
    }
  }
  const hono = new Hono();
  applyController(hono, new Controller());

  let response = await hono.request("/test1");
  expect(response.status).toBe(200);

  response = await hono.request("/test2");
  expect(response.status).toBe(200);
});

test("Endpoint() can only decorate methods and class attributes", async function () {
  expect(() => {
    //@ts-ignore
    @Endpoint("/test")
    class Test {}
  }, "Trying to decorate the class with Endpoint() throws an exception").toThrowError(DecoratorKindError);
  expect(() => {
    class Test {
      //@ts-ignore
      @Endpoint("/test") get getter() {
        return;
      }
    }
  }, "Trying to decorate the getter class with Endpoint() throws an exception").toThrowError(DecoratorKindError);
});
