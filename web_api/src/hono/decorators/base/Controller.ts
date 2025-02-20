import { DecoratorKindError } from "./errors.ts";
import { createRouterDecoratorFactory } from "./_factory.ts";

export type ControllerDecoratorTarget = new (...args: any[]) => any;

/**
 * @typeParam T Types of decoration targets constrained by constraints
 */
export type ControllerDecorator<T extends ControllerDecoratorTarget = ControllerDecoratorTarget> = (
  input: T,
  context: ClassDecoratorContext<T>,
) => void;

export type ControllerOption = {
  /** Inherit the decorator from the parent class */
  extends?: boolean;
  basePath?: string;
};
export const Controller: (option: ControllerOption) => ControllerDecorator = createRouterDecoratorFactory(
  function (ctx, option) {
    if (ctx.kind !== "class") throw new DecoratorKindError("class", ctx.kind);
    if (typeof option.basePath === "string") ctx.controller.path = option.basePath;
    if (option.extends !== undefined) ctx.controller.extends = Boolean(option.extends);
  },
);
