import { RouteObject } from "react-router";
import { lazyComponent } from "@/lib/lazy_component.ts";
import { notFoundRouter } from "../error_page/NotFound.tsx";

const routers: RouteObject[] = [
  {
    path: "center",
    Component: lazyComponent(
      () => import("./pages/BasicInfo.tsx"),
      (mod) => mod.BasicInfoPage,
    ),
  },
  {
    path: "security",
    Component: lazyComponent(
      () => import("./pages/Security.tsx"),
      (mod) => mod.Security,
    ),
  },
  notFoundRouter,
];
export default routers;
