import { Context, Hono, MiddlewareHandler } from "hono";
import { privateControllerMeta } from "./base/_metadata.ts";
import { ControllerMeta, EndpointMeta } from "./base/_type.ts";
import { getObjectClass, getParentClass } from "./_util.ts";
import { DataTransformer, PipeInput, PipeOutput, Use } from "./base.ts";

export type ApplyControllerOption = {
  basePath?: string;
};

export function applyController(hono: Hono, controller: object, option: ApplyControllerOption = {}): void {
  if (typeof controller !== "object" || controller === null)
    throw new TypeError("The controller must be an object type");
  const controllerClass = getObjectClass(controller);
  let controllerMetadataList: ControllerMetaLink | undefined;
  if (typeof controllerClass === "function") {
    controllerMetadataList = getControllerClassMetaLink(controllerClass);
  }
  if (!controllerMetadataList) {
    throw new Error("The controller class does not apply the endpoint decorator");
  }

  const controllerMetaData = mergeMetadataList(controllerMetadataList);
  const basePath = option.basePath ?? controllerMetaData.path ?? "";

  for (const endpointMeta of controllerMetaData.endpoints.values()) {
    const metadata = endpointMeta.metadata;
    const endpointApplyMeta = getEndpointApplyMeta(endpointMeta.key, metadata);

    const handler = createHandler(controller as Record<string | symbol | number, Function>, endpointApplyMeta);

    const path = basePath + (endpointMeta.path ?? "");

    const entryHandler: MiddlewareHandler = function (ctx, next) {
      CONTEXT_METADATA.set(ctx, new EndpointContext(controllerMetadataList, endpointMeta));
      return next();
    };
    {
      const endPointMiddlewares = endpointApplyMeta.useMiddlewares ?? [];
      const middleware: MiddlewareHandler[] = [
        entryHandler,
        ...controllerMetaData.useMiddlewares,
        ...endPointMiddlewares,
      ];
      if (middleware.length) hono.use(path, ...middleware);
    }

    if (!endpointMeta.method) {
      hono.all(path, handler);
    } else {
      hono.on(endpointMeta.method.toLocaleLowerCase(), path, handler);
    }
  }
}
function getEndpointApplyMeta(key: string | number | symbol, metadata: Map<any, any>) {
  const endpointApplyMeta: EndpointApplyMeta = { key: key, useMiddlewares: metadata.get(Use) };
  const inputTransformers: ((...args: any[]) => any)[] | undefined = metadata.get(PipeInput);
  if (inputTransformers) {
    if (inputTransformers.length > 1) {
      endpointApplyMeta.inputTransformers = inputTransformers.slice(0, -1);
      endpointApplyMeta.toArguments = inputTransformers.slice(-1)[0];
    } else endpointApplyMeta.toArguments = inputTransformers[0];
  }

  const outputsTransformers: ((...args: any[]) => any)[] | undefined = metadata.get(PipeOutput);
  if (outputsTransformers) {
    if (outputsTransformers.length > 1) {
      endpointApplyMeta.outputsTransformers = outputsTransformers.slice(0, -1);
      endpointApplyMeta.toResponse = outputsTransformers.slice(-1)[0];
    } else endpointApplyMeta.toResponse = outputsTransformers[0];
  }
  return endpointApplyMeta;
}
function createHandler(controller: Record<string | symbol | number, Function>, routerMeta: EndpointApplyMeta) {
  return async function (ctx: Context, next?: Function): Promise<Response> {
    let args: any[];
    if (routerMeta.toArguments) {
      const inputTransformers = routerMeta.inputTransformers ?? [];
      const finalInput = await useTransformers(inputTransformers, ctx);
      args = await routerMeta.toArguments.call(undefined, finalInput);
    } else args = [ctx];

    let result = await controller[routerMeta.key].apply(controller, args);
    if (routerMeta.toResponse) {
      if (routerMeta.outputsTransformers) {
        const outputTransformers = routerMeta.outputsTransformers ?? [];
        result = await useTransformers(outputTransformers, result);
      }
      result = await routerMeta.toResponse.call(undefined, result, ctx);
    }

    return result;
  };
}

async function useTransformers(transformers: DataTransformer<any, any>[], arg: any) {
  let transformer = transformers[0];
  while (transformer) arg = await transformer(arg);
  return arg;
}

function mergeMetadataList(controllerMetaLink?: ControllerMetaLink): ControllerApplyMeta {
  const controllerMetaList: ControllerMeta[] = [];

  while (controllerMetaLink) {
    controllerMetaList.unshift(controllerMetaLink.data);
    if (!controllerMetaLink.data.extends) break;
    controllerMetaLink = controllerMetaLink.next;
  }
  const finalMeta: ControllerApplyMeta = {
    endpoints: new Map(),
    useMiddlewares: [],
  };
  const finalEndpoints = finalMeta.endpoints;

  for (const current of controllerMetaList) {
    const metadata = current.metadata;

    const currentMiddlewares = metadata.get(Use);
    if (currentMiddlewares) finalMeta.useMiddlewares = currentMiddlewares.concat(finalMeta.useMiddlewares);

    if (typeof current.path === "string") finalMeta.path = current.path;
    for (const [key, endpointMeat] of current.endpoints) {
      finalEndpoints.set(key, endpointMeat);
    }
  }
  return finalMeta;
}

/** Return in the list，Subclasses are on the left, and superclasses are on the right */
function getControllerClassMetaLink(controllerClass: Function): ControllerMetaLink | undefined {
  let meta = privateControllerMeta.getClassMetadata(controllerClass);
  if (!meta) return;
  const controllerMeta: ControllerMetaLink | undefined = { data: meta };
  let current = controllerMeta;

  let currentClass = getParentClass(controllerClass);
  while (currentClass) {
    const meta = privateControllerMeta.getClassMetadata(currentClass);
    if (meta) {
      current.next = {
        data: meta,
      };
      current = current.next;
    } else break;
    currentClass = getParentClass(currentClass);
  }
  return controllerMeta;
}
type ControllerMetaLink = {
  data: ControllerMeta;
  next?: ControllerMetaLink;
};
type ControllerApplyMeta = Pick<ControllerMeta, "endpoints" | "path"> & {
  useMiddlewares: MiddlewareHandler[];
};
type EndpointApplyMeta = {
  key: symbol | number | string;
  useMiddlewares?: MiddlewareHandler[];

  inputTransformers?: DataTransformer<any, any>[];
  toArguments?: (...args: any[]) => any;

  outputsTransformers?: DataTransformer<any, any>[];
  toResponse?: (...args: any[]) => any;
};

export class ControllerContext {
  constructor(private readonly controllerMetaLink: ControllerMetaLink) {}

  getControllerMetadata<T = unknown>(key: any): T | undefined {
    return this.controllerMetaLink.data.metadata.get(key);
  }
  *eachParentMetadata(): Generator<ControllerContext> {
    let current = this.controllerMetaLink.next;
    while (current) {
      yield new ControllerContext(current);
      current = current.next;
    }
  }
}
export class EndpointContext extends ControllerContext {
  constructor(
    controllerMetaLink: ControllerMetaLink,
    private readonly endpoint: Readonly<EndpointMeta>,
  ) {
    super(controllerMetaLink);
  }
  getEndpointMetadata<T = unknown>(key: any): T | undefined {
    return this.endpoint.metadata.get(key);
  }
}
export function getEndpointContext(ctx: Context): EndpointContext {
  const manage = CONTEXT_METADATA.get(ctx);
  if (!manage)
    throw new Error(
      "The EndpointContext not exist, please ensure that the current route is originated using the Endpoint() decorator",
    );
  return manage;
}

const CONTEXT_METADATA = new WeakMap<Context, EndpointContext>();
