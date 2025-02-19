import { MiddlewareHandler } from "hono";
import { ControllerClass, EndpointHandler } from "./base.ts";
import { createRouterDecoratorFactory } from "./base/factory.ts";

/**
 * Use Middleware
 */
export const Use = createRouterDecoratorFactory<
  ControllerClass | EndpointHandler,
  ClassDecoratorContext | ClassFieldDecoratorContext | ClassMethodDecoratorContext,
  [middleware: MiddlewareHandler]
>(function (ctx, middleware: MiddlewareHandler) {
  if (ctx.kind === "class") ctx.controller.useMiddlewares.push(middleware);
  else {
    ctx.endpoint.useMiddlewares.push(middleware);
  }
});
