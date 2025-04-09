import { Outlet, RouteObject } from "react-router";
import { VideoBg } from "./components/VideoBg.tsx";
import { api } from "@/common/http.ts";
import { lazyPage } from "@/common/lazy_load_component.tsx";
import React from "react";

const router: RouteObject[] = [
  {
    async loader() {
      return api["/passport/config"].get().catch(() => ({}));
    },
    id: "/passport",
    element: (
      <VideoBg>
        <Outlet />
      </VideoBg>
    ),
    children: [
      {
        path: "login",
        Component: lazyPage(() => import("./pages/login.tsx").then((mod) => mod.LoginPage)),
      },
      {
        path: "signup",
        Component: lazyPage(() => import("./pages/signup.tsx").then((mod) => mod.Signup)),
      },
    ],
  },
];
export default router;
