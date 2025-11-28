import { Context, Hono, MiddlewareHandler } from "hono";
interface RouteConfigCommon {
  middlewares?: MiddlewareHandler[];

  method: string;
  routePath: string;
}
export interface RouteConfigWithInput<C extends Context = Context, Res = unknown, Input = unknown>
  extends RouteConfigCommon {
  handler: (ctx: C, input: Awaited<Input>) => Res | Promise<Res>;
  verifyInput: (ctx: C) => Awaited<Input> | Promise<Awaited<Input>>;
}
export interface RouteConfigWithoutInput<C extends Context = Context, Res = unknown> extends RouteConfigCommon {
  handler: (ctx: C, input?: undefined) => Res | Promise<Res>;
  verifyInput?: undefined;
}

export declare function createRoute<C extends Context = Context, Res = unknown>(
  define: RouteConfigWithoutInput<C, Res>,
): Route;
export declare function createRoute<C extends Context = Context, Res = unknown, Input = unknown>(
  define: RouteConfigWithInput<C, Res, Input>,
): Route;

export declare class Route {
  readonly method: string;
  readonly routePath: string;
  apply(hono: Hono): void;
}

export interface RouteGroup {
  apply(hono: Hono): void;
}
export declare function createGroup(routes: Route[]): RouteGroup;
