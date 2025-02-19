import { DecoratorKindError } from "./errors.ts";
import { createRouterDecoratorFactory } from "./factory.ts";

export type ControllerClass = new (...args: any) => any;
export type ControllerDecorator<T extends ControllerClass = ControllerClass> = (
  input: T,
  context: ClassDecoratorContext<T>,
) => void;

export const BasePath: (basePath: string) => ControllerDecorator = createRouterDecoratorFactory<
  ControllerClass,
  ClassDecoratorContext,
  [basePath: string]
>(function (ctx, basePath: string) {
  if (ctx.kind !== "class") throw new DecoratorKindError("class", ctx.kind);
  ctx.controller.path = basePath;
});
