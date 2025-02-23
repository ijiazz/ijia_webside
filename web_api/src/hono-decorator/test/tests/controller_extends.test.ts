import { Controller, applyController, Get, Use } from "@asla/hono-decorator";
import { Context, Hono } from "hono";
import { expect, test } from "vitest";
import { keyMiddleware, MIDDLEWARE_SET_KEY } from "../fixtures/hono.ts";

@Use(keyMiddleware("MidA"))
@Controller({ basePath: "/animal" })
class Animal {
  @Get("/eat") eat(ctx: Context): Response {
    const keys = ctx.get(MIDDLEWARE_SET_KEY) ?? [];
    return ctx.json(["Animal eat", ...keys]);
  }
  @Get("/sleep") sleep(ctx: Context): Response {
    const keys = ctx.get(MIDDLEWARE_SET_KEY) ?? [];
    return ctx.json(["Animal sleep", ...keys]);
  }
}

test("The decorator of the parent class is not applied by default", async function () {
  class Bird extends Animal {
    @Get("/fly") fly(ctx: Context) {
      const keys = ctx.get(MIDDLEWARE_SET_KEY) ?? [];
      return ctx.json(["Bird fly", ...keys]);
    }
  }
  const hono = new Hono();
  applyController(hono, new Bird());

  let res = await hono.request("/eat");
  expect(res.status, "The route of the parent class is not inherited").toBe(404);

  res = await hono.request("/fly");
  expect(res.status).toBe(200);
  await expect(res.json(), "The parent class of middleware is not inherited").resolves.toEqual(["Bird fly"]);
});

test("extends inherits only the decorative information of a parent class", async function () {
  class Bird extends Animal {
    @Get("/fly") fly(ctx: Context) {
      const keys = ctx.get(MIDDLEWARE_SET_KEY) ?? [];
      return ctx.json(["Bird fly", ...keys]);
    }
  }
  @Controller({ extends: true })
  class SeaGull extends Bird {
    @Get("/tweet") tweet(ctx: Context) {
      const keys = ctx.get(MIDDLEWARE_SET_KEY) ?? [];
      return ctx.json(["SeaGull tweet", ...keys]);
    }
  }
  const hono = new Hono();
  applyController(hono, new SeaGull());

  let res = await hono.request("/eat");
  expect(res.status, "Extends inherits only the decorative information of a parent class").toBe(404);

  res = await hono.request("/fly");
  expect(res.status).toBe(200);
  await expect(res.json()).resolves.toEqual(["Bird fly"]);

  res = await hono.request("/tweet");
  expect(res.status).toBe(200);
  await expect(res.json()).resolves.toEqual(["SeaGull tweet"]);
});

test("Set the inherited route configuration", async function () {
  @Controller({ extends: true })
  class Dog extends Animal {
    @Get("/jump") jump(ctx: Context) {
      const keys = ctx.get(MIDDLEWARE_SET_KEY) ?? [];
      return ctx.json(["Dog jump", ...keys]);
    }
  }
  const hono = new Hono();
  applyController(hono, new Dog());

  let res = await hono.request("/animal/eat");
  expect(res.status, "Inherits the route of the parent class").toBe(200);
  await expect(
    res.json(),
    "The parent class middleware can interact with the routes defined in the parent class",
  ).resolves.toEqual(["Animal eat", "MidA"]);

  res = await hono.request("/animal/jump");
  expect(res.status, "The basePath defined by the parent class can be applied to the routing of the subclass").toBe(
    200,
  );
  await expect(
    res.json(),
    "The parent class middleware can interact with the routing defined in the subclass",
  ).resolves.toEqual(["Dog jump", "MidA"]);

  res = await hono.request("/jump");
  await expect(
    res.status,
    "The basePath defined by the parent class can be applied to the routing of the subclass",
  ).toBe(404);
});

test("Overrides parent class methods", async function () {
  @Controller({ extends: true })
  class Cat extends Animal {
    override eat(ctx: Context): Response {
      return ctx.text("Cat eat");
    }
  }
  const hono = new Hono();
  applyController(hono, new Cat());

  let res = await hono.request("/animal/eat");
  expect(res.status, "Inherits the route of the parent class").toBe(200);
  await expect(res.text(), "The method of the subclass is called").resolves.toBe("Cat eat");
});

test("Subclasses can override the basePath of the parent class", async function () {
  @Controller({ extends: true, basePath: "/api" })
  class Cat extends Animal {}
  const hono = new Hono();
  applyController(hono, new Cat());

  let res = await hono.request("/animal/eat");
  expect(res.status, "The basePath of the parent class is overwritten").toBe(404);

  res = await hono.request("/api/eat");
  expect(
    res.status,
    "The basePath of the parent class is overwritten and the original route can no longer be requested",
  ).toBe(200);
});

test("Subclasses can override the routing of the parent class", async function () {
  @Controller({ extends: true })
  class Cat extends Animal {
    @Get("/eat") eatHandler(ctx: Context): Response {
      const keys = ctx.get(MIDDLEWARE_SET_KEY) ?? [];
      return ctx.json(["Cat eat", ...keys]);
    }
  }
  const hono = new Hono();
  applyController(hono, new Cat());

  let res = await hono.request("/animal/eat");
  expect(res.status).toBe(200);
  await expect(res.json(), "The route of the parent class is overwritten to another handler").resolves.toEqual([
    "Cat eat",
    "MidA",
  ]);
});
