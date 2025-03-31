import React from "react";
import { createBrowserRouter, Outlet, RouteObject, RouterProvider } from "react-router";
import passportRouter from "./modules/passport/router.tsx";
import profileRouter from "./modules/profile/router.tsx";
import { AntdProvider, HoFetchProvider } from "./global-provider.tsx";
import { notFoundRouter } from "./common/page_state/NotFound.tsx";
import { UserLayout } from "./modules/layout/UserLayout.tsx";
import { getPathByRoute } from "./app.ts";
import liveRoutes from "./modules/live/routes.tsx";

const coreRouters: RouteObject[] = [
  {
    Component: UserLayout,
    path: "live",
    children: liveRoutes,
  },
  { path: "passport", children: passportRouter },
  {
    Component: UserLayout,
    children: [
      { path: "live/*", element: <div>live</div> },
      { path: "profile", children: profileRouter },
      { path: "examination/*", element: <div>examination</div> },
    ],
  },
  {
    path: "lazy", // 测试 Lazy
    Component: () => (
      <React.Suspense fallback={<div>loading...</div>}>
        <LazyTest />
      </React.Suspense>
    ),
  },
  notFoundRouter,
];

const routers: RouteObject[] = [
  {
    path: "/",
    element: (
      <AntdProvider>
        <HoFetchProvider>
          <Outlet />
        </HoFetchProvider>
      </AntdProvider>
    ),
    children: coreRouters,
  },
];
export default routers;

const LazyTest = React.lazy(async () => {
  await new Promise((resolve) => {
    setTimeout(resolve, 3000);
  });
  return {
    default: () => <div>lazy</div>,
  };
});
function Router() {
  return <RouterProvider router={createBrowserRouter(routers, { basename: getPathByRoute("/") })} />;
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
