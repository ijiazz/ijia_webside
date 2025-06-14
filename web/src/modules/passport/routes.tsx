import { RouteObject } from "react-router";
import { api } from "@/common/http.ts";
import { lazyPage } from "@/common/lazy_load_component.tsx";

const router: RouteObject[] = [
  {
    async loader() {
      return api["/passport/config"].get().catch(() => ({}));
    },
    id: "/passport",
    Component: lazyPage(() => import("./components/VideoBg.tsx").then((mod) => mod.VideoBg)),
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
  {
    path: "/passport/find-account",

    Component: lazyPage(() => import("./pages/find-account.tsx").then((mod) => mod.FindAccount)),
  },
];
export default router;
