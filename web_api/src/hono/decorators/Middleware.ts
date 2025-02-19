import { MiddlewareHandler } from "hono";
import { createDecoratorFactory } from "./factory.ts";

// Middleware
export const Use = createDecoratorFactory(function ({ metadata }, middleware: MiddlewareHandler) {
  metadata.useMiddlewares.push(middleware);
});
