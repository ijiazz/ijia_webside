import { Context, Next } from "hono";
import type { EndpointDecorator } from "./Endpoint.ts";
import { createRouterDecoratorFactory } from "./_factory.ts";

export type PipeOutHandler<T> = (data: T, ctx: Context, next: Next) => undefined | Response | Promise<Response>;

export const PipeOut: <T>(
  handler: PipeOutHandler<T>,
) => EndpointDecorator<(...args: any[]) => T | Promise<Awaited<T>>> = createRouterDecoratorFactory(
  function (decoratorCtx, handler) {
    if (decoratorCtx.kind === "class") {
      decoratorCtx.controller.pipOutHandler = handler;
    } else {
      decoratorCtx.endpoint.pipOutHandler = handler;
    }
  },
);

export type PipeInHandler<T extends any[]> = (ctx: Context) => T | Promise<Awaited<T>>;

export const PipeIn: <T extends any[]>(handler: PipeInHandler<T>) => EndpointDecorator<(...data: T) => any> =
  createRouterDecoratorFactory(function (decoratorCtx, handler) {
    if (decoratorCtx.kind === "class") {
      decoratorCtx.controller.pipInHandler = handler;
    } else {
      decoratorCtx.endpoint.pipInHandler = handler;
    }
  });
