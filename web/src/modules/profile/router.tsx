import { RouteObject } from "react-router";
import { notFoundRouter } from "../../common/page_state/NotFound.tsx";
import { appLazy } from "@/common/lazy_load_component.tsx";

const routers: RouteObject[] = [
  {
    path: "center",
    Component: appLazy(
      () => import("./pages/BasicInfo.tsx"),
      (mod) => mod.BasicInfoPage,
    ),
  },
  {
    path: "security",
    Component: appLazy(
      () => import("./pages/Security.tsx"),
      (mod) => mod.Security,
    ),
  },
  notFoundRouter,
];
export default routers;
