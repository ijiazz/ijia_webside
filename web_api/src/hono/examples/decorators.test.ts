import { Context } from "hono";
import { cors } from "hono/cors";
import { bodyLimit } from "hono/body-limit";
import { Controller, Post, Get, Use } from "../decorators.ts";
import { compress } from "hono/compress";

@Use(cors({ origin: "*" }))
@Controller({ basePath: "/api" })
class TestController {
  @Use(compress())
  @Use(bodyLimit({ maxSize: 1024 }))
  @Post("/test1")
  method(ctx: Context) {
    ctx.res;
    return ctx.json({ ok: 1 });
  }

  @Get("/test2")
  method2 = () => {};

  @Get("/test3")
  method3() {
    return {
      list: [1, 2, 3],
    };
  }
}
