import { RouteObject } from "react-router";
import { lazyComponent } from "@/lib/lazy_component.ts";

const router: RouteObject[] = [
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
];
export default router;
