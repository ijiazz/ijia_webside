import { RouteObject } from "react-router";
import { lazyPage } from "@/common/lazy_load_component.tsx";
export const routes: RouteObject[] = [
  {
    path: "*",
    Component: lazyPage(() => import("@/common/page_state/Developing.tsx").then((mod) => mod.Developing)),
  },
];
