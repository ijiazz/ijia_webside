import { ControllerMeta, ControllerDecorator, ControllerClass, createDecoratorFactory } from "./factory.ts";

export const Controller = createDecoratorFactory<ControllerClass>(function (
  { metadata },
  option: ControllerConfig = {},
) {
  metadata.path = option.basePath;
});
export type ControllerConfig = {
  basePath?: string;
};
export type { ControllerMeta };
