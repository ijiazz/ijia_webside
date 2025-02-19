import { getInitDecorateMeta, privateControllerMeta } from "./_metadata.ts";
import { ControllerMeta, EndpointMeta } from "./_type.ts";

import { DecorateNotEndpointError, DecoratePrivatePropertyError, DecoratorKindError } from "./errors.ts";

export function Endpoint(path: string, method?: string): EndpointDecorator {
  return function (input: (ctx: any) => any, ctx) {
    const kind = ctx.kind;
    if (!(kind === "method" || kind === "field")) {
      throw new DecoratorKindError("method, field", kind as string);
    }
    if (ctx.private) throw new DecoratePrivatePropertyError();

    const config = getInitDecorateMeta(ctx.metadata);
    if (config.endpoints.has(ctx.name)) throw new Error("Cannot set endpoints repeatedly");
    config.endpoints.set(ctx.name, { path, method, useMiddlewares: [] });
  };
}

export type EndpointHandler = (...args: any) => any;
export type EndpointDecorator<T extends EndpointHandler = EndpointHandler> = (
  input: T,
  context: ClassMethodDecoratorContext | ClassFieldDecoratorContext,
) => void;

export type DecorateHandlerContext =
  | {
      kind: "endpoint";
      metadata: EndpointMeta;
    }
  | {
      kind: "controller";
      metadata: ControllerMeta;
    };
export type DecorateHandler<Args extends any[] = any[]> = (context: DecorateHandlerContext, ...args: Args) => void;

export function createDecoratorFactory<
  T extends EndpointHandler | ControllerClass = EndpointHandler | ControllerClass,
  Args extends any[] = any[],
>(decorate: DecorateHandler<Args>) {
  return function (...args: Args): CommonDecorator<T> {
    return function (
      input: unknown,
      ctx: ClassMethodDecoratorContext | ClassFieldDecoratorContext | ClassDecoratorContext,
    ) {
      const metadata = privateControllerMeta.getMetadata(ctx.metadata);
      if (!metadata) throw new DecorateNotEndpointError();
      if (ctx.kind === "class") {
        decorate({ metadata: metadata, kind: "controller" }, ...args);
        return;
      }
      const property = metadata.endpoints.get(ctx.name);
      if (property === undefined) throw new DecorateNotEndpointError();

      decorate({ metadata: property, kind: "endpoint" }, ...args);
    };
  };
}

export type ControllerClass = new (...args: any) => any;

export type ControllerDecorator<T extends ControllerClass = ControllerClass> = (
  input: T,
  context: ClassDecoratorContext,
) => void;

export type CommonDecorator<T extends ControllerClass | EndpointHandler> = (
  input: T,
  context: ClassDecoratorContext | ClassMethodDecoratorContext | ClassFieldDecoratorContext,
) => void;

export type { EndpointMeta, ControllerMeta };
