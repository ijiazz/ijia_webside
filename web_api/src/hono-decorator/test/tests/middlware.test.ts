import { applyController, Controller, Get, Use } from "@asla/hono-decorator";
import { Context, Hono, MiddlewareHandler } from "hono";
import { test, expect, describe } from "vitest";
import { MIDDLEWARE_SET_KEY } from "../fixtures/hono.ts";
test("Use() applies to the endpoint", async function () {
  class Controller {
    @Use(keyMiddleware("A"))
    @Get("/")
    method(ctx: Context) {
      return ctx.json(ctx.get(MIDDLEWARE_SET_KEY));
    }
  }
  const hono = new Hono();
  applyController(hono, new Controller());

  let res = await hono.request("/");
  await expect(res.json()).resolves.toEqual(["A"]);
});
test("Use() Applies to the controller", async function () {
  @Use(keyMiddleware("Mid"))
  class Controller {
    @Get("/a")
    methodA(ctx: Context) {
      return ctx.json(["methodA", ...ctx.get(MIDDLEWARE_SET_KEY)]);
    }
    @Get("/b")
    methodB(ctx: Context) {
      return ctx.json(["methodB", ...ctx.get(MIDDLEWARE_SET_KEY)]);
    }
  }
  const hono = new Hono();
  applyController(hono, new Controller());

  let res = await hono.request("/a");
  await expect(res.json()).resolves.toEqual(["methodA", "Mid"]);

  res = await hono.request("/b");
  await expect(res.json()).resolves.toEqual(["methodB", "Mid"]);
});
test("Use() cannot be applied to controllers without endpoints", async function () {
  expect(() => {
    @Use(keyMiddleware("A"))
    class Controller {}
  }).toThrowError();

  expect(() => {
    class Controller {
      @Use(keyMiddleware("A"))
      method() {}
    }
  }).toThrowError();
});

describe("Order of middleware", function () {
  const A = keyMiddleware("A");
  const B = keyMiddleware("B");
  const C = keyMiddleware("C");
  const D = keyMiddleware("D");
  const E = keyMiddleware("E");
  const F = keyMiddleware("F");
  const G = keyMiddleware("G");
  const H = keyMiddleware("H");

  @Use(A)
  @Use(B)
  class TestA {
    @Use(G)
    @Use(H)
    @Get("/")
    method(ctx: Context) {
      return ctx.json(ctx.get(MIDDLEWARE_SET_KEY));
    }
  }

  test("The order in which requests pass through the controller middleware", async function () {
    const hono = new Hono();
    applyController(hono, new TestA());

    let res = await hono.request("/");
    await expect(res.json()).resolves.toEqual(["A", "B", "G", "H"]);
  });
  test("The order in which requests pass through the inherited controller middleware", async function () {
    const hono = new Hono();

    @Use(C)
    @Use(D)
    @Controller({ extends: true })
    class TestB extends TestA {}

    @Use(E)
    @Use(F)
    @Controller({ extends: true })
    class TestC extends TestB {
      @Use(G)
      @Use(H)
      @Get("/sub")
      sub(ctx: Context) {
        return ctx.json(ctx.get(MIDDLEWARE_SET_KEY));
      }
    }
    applyController(hono, new TestB());
    applyController(hono, new TestC());

    let res = await hono.request("/");
    await expect(res.json()).resolves.toEqual(["C", "D", "A", "B", "G", "H"]);

    res = await hono.request("/sub");
    await expect(res.json()).resolves.toEqual(["E", "F", "C", "D", "A", "B", "G", "H"]);
  });
});

function keyMiddleware(key: string): MiddlewareHandler {
  return (ctx, next) => {
    let list: string[] | undefined = ctx.get(MIDDLEWARE_SET_KEY);
    if (!list) {
      list = [];
      ctx.set(MIDDLEWARE_SET_KEY, list);
    }
    list.push(key);

    return next();
  };
}
