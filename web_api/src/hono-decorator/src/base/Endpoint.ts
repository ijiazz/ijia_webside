import { createInitDecorateMeta, privateControllerMeta } from "./_metadata.ts";
import { ControllerMeta, EndpointMeta } from "./_type.ts";

import { DecoratePrivatePropertyError, DecoratorKindError } from "./errors.ts";

export type EndpointDecoratorTarget = (...args: any[]) => any;
/**
 * @typeParam T: Constrains the type of decoration target
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
    const key = (method ? method : "") + ":" + path;
    if (config.endpoints.has(key))
      throw new Error("One controller cannot be configured with multiple routes of the same type");

    const endpointMeta: EndpointMeta = { key: ctx.name, path, method, metadata: new Map() };
    config.endpoints.set(key, endpointMeta);
    config.endpointsField.set(ctx.name, endpointMeta);
  };
}
function getInitDecorateMeta(meta: object): ControllerMeta {
  let controllerMeta = privateControllerMeta.getMetadata(meta);
  if (!controllerMeta) {
    if (typeof meta !== "object") throw new Error("Unable to retrieve metadata");
    controllerMeta = createInitDecorateMeta();
    privateControllerMeta.set(meta, controllerMeta);
  }
  return controllerMeta;
}
