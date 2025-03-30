import * as React from "react";
import { renderToString, renderToReadableStream } from "react-dom/server";
import {
  createStaticHandler,
  createStaticRouter,
  RouteObject,
  StaticHandler,
  matchRoutes,
  RouterProvider,
} from "react-router";
import routes, { SsrRootWarp } from "./routes.tsx";

export interface SsrRender {
  renderToReadableStream: (
    request: Request,
    warp?: React.ComponentType<React.PropsWithChildren>,
  ) => Promise<ReadableStream>;
  renderToString: (request: Request) => Promise<string>;
  isMatch(path: string): boolean;
}
export class ReactRouterSsrRender implements SsrRender {
  constructor(routers: RouteObject[]) {
    this.#staticHandler = createStaticHandler(routers);
  }
  #staticHandler: StaticHandler;
  async #gerRouter(request: Request) {
    const { query, dataRoutes } = this.#staticHandler;
    const context = await query(request);
    if (context instanceof Response) throw context;
    const router = createStaticRouter(dataRoutes, context);
    return (
      <SsrRootWarp>
        <RouterProvider router={router} />
      </SsrRootWarp>
    );
  }
  /**
   * @param {Request} request
   */
  async renderToReadableStream(request: Request) {
    const reactNode = await this.#gerRouter(request);
    return renderToReadableStream(reactNode);
  }
  /**
   * @param {Request} request
   */
  async renderToString(request: Request): Promise<string> {
    const reactNode = await this.#gerRouter(request);
    return renderToString(reactNode);
  }
  isMatch(path: string): boolean {
    const matcher = matchRoutes(this.#staticHandler.dataRoutes, path);
    return matcher ? matcher.length > 0 : false;
  }
}

export const renderer = new ReactRouterSsrRender(routes);
