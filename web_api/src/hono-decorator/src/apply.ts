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
  let controllerMetaLink: ControllerMetaLink | undefined;
  if (typeof controllerClass === "function") {
    controllerMetaLink = getControllerClassMetaLink(controllerClass);
  }
  if (!controllerMetaLink) {
    throw new Error("The controller class does not apply the endpoint decorator");
  }

  const { basePath: controllerBasePath, mergedEndpointMap } = mergeControllerMetadataList(controllerMetaLink);
  const basePath = option.basePath ?? controllerBasePath ?? "";

  for (const endpointApplyMeta of mergedEndpointMap.values()) {
    const handler = createHandler(controller as Record<string | symbol | number, Function>, endpointApplyMeta);

    const path = basePath + endpointApplyMeta.path;

    const entryHandler: MiddlewareHandler = function (ctx, next) {
      CONTEXT_METADATA.set(ctx, new EndpointContext(controllerMetaLink.childRoot, endpointApplyMeta));
      return next();
    };
    const middleware: MiddlewareHandler[] = [entryHandler, ...(endpointApplyMeta.useMiddlewares ?? [])];
    if (!endpointApplyMeta.method) {
      hono.all(path, ...middleware, handler);
    } else {
      hono.on(endpointApplyMeta.method, path, ...middleware, handler);
    }
  }
}
function getEndpointApplyMeta(endpointMetadata: EndpointMeta, controllerMiddlewares: MiddlewareHandler[] = []) {
  const metadata = endpointMetadata.metadata;

  const endpointMiddlewares: MiddlewareHandler[] = metadata.get(Use) ?? [];

  const endpointApplyMeta: EndpointApplyMeta = {
    ...endpointMetadata,
    useMiddlewares: [...controllerMiddlewares, ...endpointMiddlewares],
    metadata,
  };
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

function mergeControllerMetadataList(controllerMetaLink: ControllerMetaLink) {
  let basePath: string | undefined;
  const mergedEndpointMap = new Map<string | symbol | number, EndpointApplyMeta>();

  let node: ControllerMetaLinkNode | undefined = controllerMetaLink.childRoot;
  let mergedMiddlewares: MiddlewareHandler[] = [];
  while (node) {
    const controllerMeta = node.data;
    if (basePath === undefined) basePath = controllerMeta.path;
    const middlewares = controllerMeta.metadata.get(Use);
    if (middlewares?.length) mergedMiddlewares = mergedMiddlewares.concat(middlewares);
    node = node.parent;

    for (const [key, endpointMeta] of controllerMeta.endpoints) {
      if (mergedEndpointMap.has(key)) continue;
      mergedEndpointMap.set(key, getEndpointApplyMeta(endpointMeta, mergedMiddlewares));
    }
  }

  return { basePath, mergedEndpointMap };
}

/** Return link direction:  Child -> Parent   */
function getControllerClassMetaLink(controllerClass: Function): ControllerMetaLink | undefined {
  let meta = privateControllerMeta.getClassMetadata(controllerClass);
  if (!meta) return;
  const root: ControllerMetaLinkNode | undefined = { data: meta };

  let current = root;
  if (meta.extends) {
    let currentClass = getParentClass(controllerClass);
    while (currentClass) {
      meta = privateControllerMeta.getClassMetadata(currentClass);
      if (meta) {
        current.parent = {
          data: meta,
          child: current,
        };
        current = current.parent;

        if (!meta.extends) break;
      } else break;
      currentClass = getParentClass(currentClass);
    }
  }

  return { childRoot: root, parentRoot: current };
}

type ControllerMetaLinkNode = {
  data: ControllerMeta;
  parent?: ControllerMetaLinkNode;
  child?: ControllerMetaLinkNode;
};
type ControllerMetaLink = {
  childRoot: ControllerMetaLinkNode;
  parentRoot: ControllerMetaLinkNode;
};
type EndpointApplyMeta = EndpointMeta & {
  useMiddlewares?: MiddlewareHandler[];

  inputTransformers?: DataTransformer<any, any>[];
  toArguments?: (...args: any[]) => any;

  outputsTransformers?: DataTransformer<any, any>[];
  toResponse?: (...args: any[]) => any;
};

export class ControllerContext {
  constructor(private readonly controllerMetaLink: ControllerMetaLinkNode) {}

  getControllerMetadata<T = unknown>(key: any): T | undefined {
    return this.controllerMetaLink.data.metadata.get(key);
  }
  *eachParentMetadata(): Generator<ControllerContext> {
    let current = this.controllerMetaLink.parent;
    while (current) {
      yield new ControllerContext(current);
      current = current.parent;
    }
  }
}
export class EndpointContext extends ControllerContext {
  constructor(
    controllerMetaLink: ControllerMetaLinkNode,
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
