import React, { useMemo } from "react";
import { getPathByRoute } from "./app.ts";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen.ts";

export function genRouter() {
  return createRouter({ routeTree });
}

export function SpaRoot(props: {}) {
  const router = useMemo(() => genRouter(), []);
  return <RouterProvider router={router} basepath={getPathByRoute("/")} />;
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
