import { Context } from "hono";
import type { EndpointDecorator } from "./Endpoint.ts";
import { createMetadataDecoratorFactory } from "./factory.ts";
import { DecorateReuseError } from "./errors.ts";

export type DataTransformer<Input, Output> = (input: Input) => Output;

export type ResponseTransformer<T> = (result: T, ctx: Context) => Response | Promise<Response>;

interface ResTransformDecoratorFactory {
  <T>(handler: ResponseTransformer<T>): EndpointDecorator<(...args: any[]) => T | Promise<T>>;
  <R0, R1>(
    pipe: DataTransformer<R0, R1>,
    handler: ResponseTransformer<R1>,
  ): EndpointDecorator<(...args: any[]) => R0 | Promise<R0>>;
  <R0, R1, R2>(
    pipe1: DataTransformer<R0, R1>,
    pipe2: DataTransformer<R1, R2>,
    handler: ResponseTransformer<R2>,
  ): EndpointDecorator<(...args: any[]) => R0 | Promise<R0>>;
  <
    R0,
    ResFinal,
    Pipes extends [
      DataTransformer<R0, any>,
      ...pipes: DataTransformer<any, any>[],
      handler: ResponseTransformer<ResFinal>,
    ],
  >(
    ...pipes: Pipes
  ): EndpointDecorator<(...args: any[]) => R0 | Promise<R0>>;
}

export const PipeOutput: ResTransformDecoratorFactory = createMetadataDecoratorFactory<Function[], Function[]>(
  function (handlers, { metadata }) {
    if (metadata) throw new DecorateReuseError("PipeOutput");
    return handlers;
  },
);

export type RequestTransformer<Args extends any[], Input = unknown> = (input: Input) => Args | Promise<Args>;

interface ReqTransformDecoratorFactory {
  <Args extends any[]>(handler: RequestTransformer<Args, Context>): EndpointDecorator<(...data: Args) => any>;
  <P0 extends any[], P1>(
    pipe: DataTransformer<Context, P1>,
    handler: RequestTransformer<P0, P1>,
  ): EndpointDecorator<(...data: P0) => any>;
  <P0 extends any[], P1, P2>(
    pipe1: DataTransformer<Context, P1>,
    pipe2: DataTransformer<P1, P2>,
    handler: RequestTransformer<P0, P2>,
  ): EndpointDecorator<(...data: P0) => any>;
  <
    P0 extends any[],
    Pipes extends [
      pipe1: DataTransformer<Context, any>,
      ...args: DataTransformer<any, any>[],
      handler: RequestTransformer<P0, any>,
    ],
  >(
    ...transformers: Pipes
  ): EndpointDecorator<(...data: P0) => any>;
}

export const PipeInput: ReqTransformDecoratorFactory = createMetadataDecoratorFactory<Function[], Function[]>(function (
  handlers,
  { metadata },
) {
  if (metadata) throw new DecorateReuseError("PipeInput");
  return handlers;
});
