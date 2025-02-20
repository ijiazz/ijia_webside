import { getInitDecorateMeta } from "./_metadata.ts";

import { DecoratePrivatePropertyError, DecoratorKindError } from "./errors.ts";

export type EndpointDecoratorTarget = (...args: any[]) => any;
/**
 * @typeParam T Types of decoration targets constrained by constraints
 */
export type EndpointDecorator<T extends EndpointDecoratorTarget = EndpointDecoratorTarget> = (
  input: T | undefined,
  context: ClassMethodDecoratorContext<unknown, T> | ClassFieldDecoratorContext<unknown, T>,
) => void;

export function Endpoint(path: string, method?: string): EndpointDecorator {
  return function (
    input: undefined | EndpointDecoratorTarget,
    ctx: ClassMethodDecoratorContext | ClassFieldDecoratorContext,
  ) {
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
