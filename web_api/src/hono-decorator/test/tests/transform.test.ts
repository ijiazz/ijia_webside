import { test, expect } from "vitest";
import { Hono } from "hono";
import { applyController, Get, PipeInput, PipeOutput } from "@asla/hono-decorator";

test("transform", async function () {
  class Controller {
    @PipeInput(async function (ctx) {
      const title = ctx.req.query("title")!;
      const number = ctx.req.query("number")!;
      return [title, +number] as const;
    })
    @PipeOutput(function (data, ctx) {
      return ctx.text(data.body);
    })
    @Get("/transform")
    method(title: string, num: number) {
      return { body: title + num };
    }
  }

  const hono = new Hono();
  applyController(hono, new Controller());

  let res = await hono.request("/transform?title=hi&number=12");
  expect(res.status).toBe(200);
  await expect(res.text()).resolves.toBe("hi12");
});

test("PipeInput() cannot be used twice on the same target", async function () {
  expect(() => {
    class Controller {
      @PipeInput((ctx) => [])
      @PipeInput((ctx) => [])
      @Get("/transform")
      method() {}
    }
  }).toThrowError();
});

test("The Endpoint decorator must be applied before PipeInput() can be applied", async function () {
  expect(() => {
    class Controller {
      @PipeInput((ctx) => [])
      method() {}
    }
  }).toThrowError();
});
test("PipeOutput() cannot be used twice on the same target", async function () {
  expect(() => {
    class Controller {
      @PipeOutput((data, ctx) => ctx.body(null, 200))
      @PipeOutput((data, ctx) => ctx.body(null, 200))
      @Get("/transform")
      method() {}
    }
  }).toThrowError();
});
test("The Endpoint decorator must be applied before PipeOutput() can be applied", async function () {
  expect(() => {
    class Controller {
      @PipeOutput((data, ctx) => ctx.body(null, 200))
      method() {}
    }
  }).toThrowError();
});
