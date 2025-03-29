/// <reference types="vite/client" />
import "@ant-design/v5-patch-for-react-19";
import "./styles/global.css";
import React from "react";

import { hydrateRoot } from "react-dom/client";
import routerRoot, { SsrClientRoot } from "./routes.tsx";
import { matchRoutes } from "react-router";
import { remoteLoading } from "./app.ts";

console.log("应用运行于 SSR 模式");
const mountApp = () => {
  hydrateRoot(document, <SsrClientRoot />);
};
const waitLazy = async () => {
  const lazyMatches = matchRoutes(routerRoot, window.location)
    ?.filter((m) => m.route.lazy)
    .map(async (m) => {
      const routeModule = await m.route.lazy!();
      Object.assign(m.route, { ...routeModule, lazy: undefined });
    });
  if (lazyMatches && lazyMatches?.length > 0) {
    await Promise.all(lazyMatches);
  }
};
waitLazy().then(mountApp);
remoteLoading();
