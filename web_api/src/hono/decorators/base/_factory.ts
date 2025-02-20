import { privateControllerMeta } from "./_metadata.ts";
import { ControllerMeta, EndpointMeta } from "./_type.ts";

import { DecorateNotEndpointError } from "./errors.ts";

export type HonoDecoratorContext = ClassDecoratorContext | ClassMethodDecoratorContext | ClassFieldDecoratorContext;
export type HonoDecorator<Target, Ctx extends HonoDecoratorContext> = (input: Target, context: Ctx) => void;

export type ControllerDecorateHandlerContext = {
  kind: ClassDecoratorContext["kind"];
  name?: string;
  controller: ControllerMeta;
};
export type EndpointDecorateHandlerContext = {
  kind: (ClassMethodDecoratorContext | ClassFieldDecoratorContext)["kind"];
  name: string | symbol;
  controller: ControllerMeta;
  endpoint: EndpointMeta;
};
export type DecorateHandlerContext = ControllerDecorateHandlerContext | EndpointDecorateHandlerContext;

export type DecorateHandler<Args extends any[] = any[], Ctx extends DecorateHandlerContext = DecorateHandlerContext> = (
  context: Ctx,
  ...args: Args
) => void;

export function createRouterDecoratorFactory<
  Target = any,
  Ctx extends HonoDecoratorContext = HonoDecoratorContext,
  Args extends any[] = any[],
>(decorate: DecorateHandler<Args>): (...args: Args) => HonoDecorator<Target, Ctx> {
  return function (...args: Args): HonoDecorator<Target, Ctx> {
    return function (input: unknown, ctx: HonoDecoratorContext) {
      const metadata = privateControllerMeta.getMetadata(ctx.metadata);
      if (!metadata) throw new DecorateNotEndpointError();
      if (ctx.kind === "class") {
        decorate({ controller: metadata, kind: ctx.kind, name: ctx.name }, ...args);
        return;
      }
      const property = metadata.endpoints.get(ctx.name);
      if (property === undefined) throw new DecorateNotEndpointError();

      decorate({ controller: metadata, kind: ctx.kind, name: ctx.name, endpoint: property }, ...args);
    };
  };
}
