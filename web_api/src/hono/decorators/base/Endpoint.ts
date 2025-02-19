import { getInitDecorateMeta } from "./_metadata.ts";

import { DecoratePrivatePropertyError, DecoratorKindError } from "./errors.ts";

export type EndpointHandler = (...args: any[]) => any;
export type EndpointDecorator<T extends EndpointHandler = EndpointHandler> = (
  input: T | undefined,
  context: ClassMethodDecoratorContext<unknown, T> | ClassFieldDecoratorContext<unknown, T>,
) => void;

export function Endpoint(path: string, method?: string): EndpointDecorator {
  return function (input: undefined | EndpointHandler, ctx: ClassMethodDecoratorContext | ClassFieldDecoratorContext) {
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
