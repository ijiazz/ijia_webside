import { RouteObject } from "react-router";
import { lazyPage } from "@/common/lazy_load_component.tsx";

const routes: RouteObject[] = [
  {
    index: true,
    Component: lazyPage(() => import("./pages/home.tsx").then((mod) => mod.HomePage)),
  },
  {
    path: "publish",
    Component: lazyPage(() => import("./pages/publish.tsx").then((mod) => mod.PublishPostPage)),
  },
];
export default routes;
