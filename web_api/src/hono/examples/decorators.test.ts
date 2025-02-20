import { Context, Hono } from "hono";
import { Controller, Post, Get, Use, applyController, ToResponse } from "../decorators.ts";
import { compress } from "hono/compress";
import { bodyLimit } from "hono/body-limit";
import { cors } from "hono/cors";

@Use(cors({ origin: "*" }))
@Controller({ basePath: "/api" })
class TestController {
  @Use(compress())
  @Use(bodyLimit({ maxSize: 1024 }))
  @Post("/test1")
  method1(ctx: Context) {
    return ctx.json({ ok: 1 });
  }

  @Get("/test2")
  method2 = () => {};

  @ToResponse((data, ctx) => {
    data.body; // string
    data.title; // string

    //@ts-expect-error Field "content" does not exist
    data.content;

    return ctx.html(
      `<html>
        <head>
          <title>${data.title}</title>
        </head>
        <body>
        ${data.body}
        </body>
      </html>`,
    );
  })
  @Get("/test3")
  method3(ctx: Context) {
    return {
      title: "123",
      body: "abc",
    };
  }
}
const hono = new Hono();
applyController(hono, new TestController());
