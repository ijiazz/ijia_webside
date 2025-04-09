import { lazyPage } from "@/common/lazy_load_component.tsx";
import { RouteObject } from "react-router";

const routers: RouteObject[] = [
  {
    path: "center",
    Component: lazyPage(() => import("./pages/BasicInfo.tsx").then((mod) => mod.BasicInfoPage)),
  },
  {
    path: "security",
    Component: lazyPage(() => import("./pages/Security.tsx").then((mod) => mod.Security)),
  },
];
export default routers;
