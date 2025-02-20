import { Context } from "hono";

import { Get, ToArguments, ToResponse } from "../decorators.ts";

class Controller {
  @Get("/test1")
  method1(ctx: Context) {} //If the ToArguments decorator is not applied, the first argument is passed to Context

  @ToArguments(function (ctx: Context) {
    //The returned type is the same as the parameter for method2
    // If types are inconsistent, typescript prompts an exception
    return [1, "abc"];
  })

  //The type of data is the same as that returned by method2
  // If types are inconsistent, typescript prompts an exception
  @ToResponse((data, ctx: Context) => {
    data.body; // string
    data.title; // string

    //@ts-expect-error content not exist
    data.content;

    return ctx.text("ok");
  })
  @Get("/test2")
  method2(size: number, id: string) {
    return {
      title: "123",
      body: "abc",
    };
  }
}
