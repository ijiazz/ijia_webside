import { MiddlewareHandler } from "hono";
import { ControllerDecoratorTarget, EndpointDecoratorTarget } from "../base.ts";
import { createRouterDecoratorFactory } from "./_factory.ts";

export type MiddlewareDecoratorTarget = ControllerDecoratorTarget | EndpointDecoratorTarget;
export type MiddlewareDecorator<T extends MiddlewareDecoratorTarget = MiddlewareDecoratorTarget> = (
  input: unknown,
  context: ClassDecoratorContext | ClassMethodDecoratorContext | ClassFieldDecoratorContext,
) => void;
/**
 * Use Middleware
 */
export const Use: (middleware: MiddlewareHandler) => MiddlewareDecorator = createRouterDecoratorFactory(
  function (ctx, middleware) {
    if (ctx.kind === "class") ctx.controller.useMiddlewares.push(middleware);
    else {
      ctx.endpoint.useMiddlewares.push(middleware);
    }
  },
);
