import { Context } from "hono";
import type { EndpointDecorator } from "./Endpoint.ts";
import { createRouterDecoratorFactory } from "./_factory.ts";
import { DecoratorKindError } from "./errors.ts";

export type Transformer<T> = (data: T, ctx: Context) => Response | Promise<Response>;

export const ToResponse: <T>(
  handler: Transformer<T>,
) => EndpointDecorator<(...args: any[]) => T | Promise<Awaited<T>>> = createRouterDecoratorFactory(
  function (decoratorCtx, handler) {
    if (decoratorCtx.kind === "class") {
      throw new DecoratorKindError("method, field", decoratorCtx.kind);
    } else {
      decoratorCtx.endpoint.pipOutHandler = handler;
    }
  },
);

export type PipeInHandler<T extends any[]> = (ctx: Context) => T | Promise<Awaited<T>>;

export const ToArguments: <T extends any[]>(handler: PipeInHandler<T>) => EndpointDecorator<(...data: T) => any> =
  createRouterDecoratorFactory(function (decoratorCtx, handler) {
    if (decoratorCtx.kind === "class") {
      throw new DecoratorKindError("method, field", decoratorCtx.kind);
    } else {
      decoratorCtx.endpoint.pipInHandler = handler;
    }
  });
