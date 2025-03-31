import { RouteObject } from "react-router";
import { notFoundRouter } from "../../common/page_state/NotFound.tsx";
import { appLazy } from "@/common/lazy_load_component.tsx";

const routes: RouteObject[] = [
  {
    index: true,
    Component: appLazy(
      () => import("./pages/home.tsx"),
      (mod) => mod.HomePage,
    ),
  },
  notFoundRouter,
];
export default routes;
