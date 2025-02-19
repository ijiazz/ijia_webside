import { Context, Next } from "hono";

import { Get, EndpointDecorator } from "../decorators.ts";
//TODO
export declare function PipeOut<T extends any>(
  toResponse: (data: T, ctx: Context, next: Next) => undefined | Response | Promise<Response>,
): EndpointDecorator<(...args: any[]) => T | Promise<T>>;

//TODO
export declare function PipeIn<T extends any[]>(
  toParam: (ctx: Context) => T | Promise<T>,
): EndpointDecorator<(...data: T) => any>;
