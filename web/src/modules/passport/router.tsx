import { Outlet, RouteObject } from "react-router";
import { VideoBg } from "./components/VideoBg.tsx";
import { api } from "@/common/http.ts";
import { appLazy } from "@/common/lazy_load_component.tsx";
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
        Component: appLazy(
          () => import("./pages/login.tsx"),
          (mod) => mod.LoginPage,
        ),
      },
      {
        path: "signup",
        Component: appLazy(
          () => import("./pages/signup.tsx"),
          (mod) => mod.Signup,
        ),
      },
    ],
  },
];
export default router;
