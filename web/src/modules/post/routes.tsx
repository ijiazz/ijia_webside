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
    shouldRevalidate({ currentUrl, nextUrl }) {
      return false;
    },
    path: "list",
    id: "/wall",
    Component: lazyPage(() => import("./layout/WallLayout.tsx").then((mod) => mod.PostLayout)),
    children: [
      {
        path: ":groupId?",
        index: true,
        Component: lazyPage(() => import("./pages/confession_wall/index.tsx").then((mod) => mod.PostListPage)),
      },
    ],
  },
  {
    path: "review",
    loader: () => {
      return api["/post/review/next"].get();
    },
    Component: lazyPage(() => import("./pages/review.tsx").then((mod) => mod.ReviewPage)),
  },
];
export default routes;
