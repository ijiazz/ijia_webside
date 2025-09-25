import * as React from "react";
import {
  RouterServer,
  createRequestHandler,
  renderRouterToString,
  renderRouterToStream,
} from "@tanstack/react-router/ssr/server";
import { genRouter, SsrRootWarp } from "./router.tsx";

export function renderByString(request: Request): Promise<Response> {
  const handler = createRequestHandler({ request, createRouter: genRouter });

  return handler(({ responseHeaders, router }) => {
    return renderRouterToString({
      responseHeaders,
      router,
      children: (
        <SsrRootWarp>
          <RouterServer router={router} />
        </SsrRootWarp>
      ),
    });
  });
}
export function renderByStream(request: Request): Promise<Response> {
  const handler = createRequestHandler({ request, createRouter: genRouter });

  return handler(({ responseHeaders, router }) => {
    return renderRouterToStream({
      request,
      responseHeaders,
      router,
      children: (
        <SsrRootWarp>
          <RouterServer router={router} />
        </SsrRootWarp>
      ),
    });
  });
}
