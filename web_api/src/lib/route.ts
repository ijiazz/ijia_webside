import { Context } from "hono";

interface HonoLike {
  on(method: string, routePath: string, ...handlers: MiddlewareHandler<any>[]): void;
}
// interface HonoContextLike {
//   text(text: string): Response;
//   body(body: unknown): Response;
//   json(json: unknown): Response;
//   newResponse(body: unknown, status?: number): Response;
// }
type HonoContextLike = Context;

type MiddlewareHandler<C> = (ctx: C, next: () => Promise<void>) => Promise<Response | void>;

interface RouteConfigCommon<C extends HonoContextLike = HonoContextLike> {
  middlewares?: (MiddlewareHandler<C> | null)[];

  method: string;
  routePath: string;
}
export interface RouteConfigWithInput<C extends HonoContextLike, Res = unknown, Input = unknown>
  extends RouteConfigCommon<C> {
  handler: (input: Awaited<Input>, ctx: C) => Res | Promise<Res>;
  validateInput: (ctx: C) => Awaited<Input> | Promise<Awaited<Input>>;
}
export interface RouteConfigWithoutInput<C extends HonoContextLike = HonoContextLike, Res = unknown>
  extends RouteConfigCommon<C> {
  handler: (input: undefined, ctx: C) => Res | Promise<Res>;
  validateInput?: undefined;
}

interface RouteConfig<C extends HonoContextLike> extends RouteConfigCommon<C> {
  handler: (input: any, ctx: C) => any;
  validateInput?: (ctx: C) => any;
}

function createRoute<C extends HonoContextLike = HonoContextLike, Res = unknown>(
  define: RouteConfigWithoutInput<C, Res>,
): Route<C>;
function createRoute<C extends HonoContextLike = HonoContextLike, Res = unknown, Input = unknown>(
  define: RouteConfigWithInput<C, Res, Input>,
): Route<C>;
function createRoute(define: RouteConfig<any>): Route<any> {
  return new Route(define);
}

interface CreateRoute<C extends HonoContextLike> {
  <Res = unknown>(define: RouteConfigWithoutInput<C, Res>): Route<C>;
  <Res = unknown, Input = unknown>(define: RouteConfigWithInput<C, Res, Input>): Route<C>;
}

export interface RouteApplyOption {
  basePath?: string;
}
export class Route<C extends HonoContextLike> {
  static create = createRoute;
  static createFactory<C extends HonoContextLike>(): CreateRoute<C> {
    return createRoute;
  }
  readonly method: string;
  readonly routePath: string;
  readonly #middlewares: MiddlewareHandler<C>[];

  constructor(config: RouteConfig<C>) {
    this.method = config.method;
    this.routePath = config.routePath;

    const { handler, validateInput } = config;
    const middlewares: MiddlewareHandler<C>[] = config.middlewares?.filter((item) => typeof item === "function") || [];
    this.#middlewares = [...middlewares, createAutoHandler({ handler, validateInput })];
  }
  apply(hono: HonoLike, options: RouteApplyOption = {}): void {
    const { basePath = "" } = options;
    const config = this;
    hono.on(config.method, basePath + config.routePath, ...config.#middlewares);
  }
}
export class RouteGroup<C extends HonoContextLike = HonoContextLike> {
  constructor(options: { middlewares?: (MiddlewareHandler<C> | null)[] } = {}) {
    const { middlewares } = options;
    this.#middlewares = middlewares ? middlewares.filter((item) => typeof item === "function") : [];
  }
  #middlewares: readonly MiddlewareHandler<C>[] = [];
  #routes: Route<C>[] = [];
  apply(hono: HonoLike, option: RouteApplyOption = {}) {
    for (const route of this.#routes) {
      route.apply(hono, option);
    }
  }
  create<Res, Input>(define: RouteConfigWithInput<C, Res, Input>): Route<C>;
  create<Res>(define: RouteConfigWithoutInput<C, Res>): Route<C>;
  create(define: RouteConfig<C>): Route<C> {
    const { middlewares = [] } = define;
    const route = new Route({ ...define, middlewares: [...this.#middlewares, ...middlewares] });
    this.#routes.push(route);
    return route;
  }
  *[Symbol.iterator](): Generator<Route<C>> {
    yield* this.#routes;
  }
}

interface AutoHandlerConfig<C, Res = unknown, Input = unknown> {
  handler: (input: Awaited<Input>, ctx: C) => Res | Promise<Res>;
  validateInput?: (ctx: C) => Input | Promise<Input>;
}

function createAutoHandler<C extends HonoContextLike, Res = unknown, Input = unknown>(
  config: AutoHandlerConfig<C, Res, Input>,
): (ctx: C) => Promise<Response> {
  const { handler, validateInput } = config;

  return async function routeHandler(ctx: C): Promise<Response> {
    const input = await validateInput?.(ctx);
    const result = await handler(input!, ctx);
    return toResponse(result, ctx);
  };
}

function toResponse(result: unknown, ctx: HonoContextLike): Response {
  switch (typeof result) {
    case "number":
    case "string": {
      const contentType = ctx.res.headers.get("Content-Type");
      if (!contentType) ctx.header("Content-Type", "text/plain; charset=utf-8");
      return ctx.body(result.toString());
    }
    case "object": {
      if (result === null) return ctx.body(null);
      if (result instanceof Response) return result;
      else if (result instanceof ReadableStream) return ctx.body(result);
      else if (result instanceof Uint8Array) return ctx.body(result as Uint8Array<ArrayBuffer>);
      return ctx.json(result);
    }
    case "undefined":
      return ctx.body(null);
    default:
      return ctx.text("unknown body type", 500);
  }
}
