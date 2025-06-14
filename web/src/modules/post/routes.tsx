import { RouteObject, Navigate } from "react-router";
import { lazyPage } from "@/common/lazy_load_component.tsx";
import { api } from "@/common/http.ts";
import React from "react";
const routes: RouteObject[] = [
  {
    index: true,
    element: <Navigate to="./list" />,
  },
  {
    path: "publish",
    Component: lazyPage(() => import("./pages/publish.tsx").then((mod) => mod.PublishPostPage)),
  },
  {
    async loader(data, ctx) {
      return api["/post/group/list"].get().catch(() => undefined);
    },
    path: "list",
    id: "/wall",
    Component: lazyPage(() => import("./layout/WallLayout.tsx").then((mod) => mod.PostLayout)),
    children: [
      {
        path: ":groupId?",
        index: true,
        Component: lazyPage(() => import("./pages/wall.tsx").then((mod) => mod.PostListPage)),
      },
    ],
  },
];
export default routes;
