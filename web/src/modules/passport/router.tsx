import { Outlet, RouteObject } from "react-router";
import { lazyComponent } from "@/lib/lazy_component.ts";
import { VideoBg } from "./components/VideoBg.tsx";
import { api } from "@/common/http.ts";

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
        Component: lazyComponent(
          () => import("./pages/login.tsx"),
          (mod) => mod.LoginPage,
        ),
      },
      {
        path: "signup",
        Component: lazyComponent(
          () => import("./pages/signup.tsx"),
          (mod) => mod.Signup,
        ),
      },
    ],
  },
];
export default router;
