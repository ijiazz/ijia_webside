import React, { useEffect } from "react";
import { createBrowserRouter, Outlet, RouteObject, RouterProvider, useViewTransitionState } from "react-router";
import passportRouter from "./modules/passport/routes.tsx";
import profileRouter from "./modules/profile/routes.tsx";
import { lazyPage } from "@/common/lazy_load_component.tsx";
import liveRoutes from "./modules/live/routes.tsx";
import { notFoundRouter } from "./common/page_state/NotFound.tsx";
import { getPathByRoute, remoteLoading } from "./app.ts";
const coreRoutes: RouteObject[] = [
  {
    index: true,
    lazy: () => import("./modules/home/page.tsx").then((mod) => mod.page),
  },
  { path: "passport", children: passportRouter },
  {
    Component: lazyPage(() => import("./modules/layout/UserLayout.tsx").then((mod) => mod.UserLayout)),
    children: [
      { path: "live", children: liveRoutes },
      { path: "profile", children: profileRouter },
      { path: "examination/*", element: <div>examination</div> },
      notFoundRouter,
    ],
  },
  notFoundRouter,
];

const routes: RouteObject[] = [
  {
    path: "/",
    lazy: () => {
      return import("./global-provider.tsx").then(({ AntdProvider, HoFetchProvider }) => ({
        Component() {
          return (
            <AntdProvider>
              <HoFetchProvider>
                <Outlet />
              </HoFetchProvider>
            </AntdProvider>
          );
        },
      }));
    },
    HydrateFallback() {
      useEffect(() => remoteLoading, []);
      return null;
    },
    children: coreRoutes,
  },
];
export default routes;

function Router() {
  return <RouterProvider router={createBrowserRouter(routes, { basename: getPathByRoute("/") })} />;
}

export function SpaRoot() {
  return <Router />;
}

export function SsrClientRoot() {
  return (
    <SsrRootWarp>
      <Router />
    </SsrRootWarp>
  );
}
export function SsrRootWarp(props: React.PropsWithChildren) {
  return (
    <html>
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>IJIA学院</title>
        <meta name="description" content="我要成为IJIA高手！" />
        <meta name="keywords" content="IJIA学院,爱佳学院" />
        <meta name="author" content="IJIA学院" />
        <meta name="Robots" content="noindex" />
        <link rel="canonical" href="https://ijiazz.cn/" />
        <style>
          {`
          html,
          body {
            padding: 0;
            margin: 0;
            height: 100%;
          }
        `}
        </style>
      </head>
      <body>{props.children}</body>
    </html>
  );
}
