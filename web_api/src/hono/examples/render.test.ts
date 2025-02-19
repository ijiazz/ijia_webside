import { Context, Next } from "hono";

import { Get, EndpointDecorator } from "../decorators.ts";

declare function PipeOut<T extends any>(
  toResponse: (data: T, ctx: Context, next: Next) => undefined | Response | Promise<Response>,
): EndpointDecorator<(...args: any[]) => T | Promise<T>>;

declare function PipeIn<T extends any[]>(
  toParam: (ctx: Context) => T | Promise<T>,
): EndpointDecorator<(...data: T) => any>;

class TestController {
  @PipeOut((data, ctx) => {
    data.body;
    data.title;

    //@ts-expect-error content not exist
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
  @Get("/test1")
  method1(ctx: Context) {
    return {
      title: "123",
      body: "abc",
    };
  }

  @PipeIn(function (ctx) {
    return [ctx, ""];
  })
  @Get("/test2")
  method2(ctx: Context, param: string) {
    return {
      list: [1, 2, 3],
    };
  }
}
