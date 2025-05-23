import { RouteObject } from "react-router";
import { lazyPage } from "@/common/lazy_load_component.tsx";

const routes: RouteObject[] = [
  {
    index: true,
    Component: lazyPage(
      () => import("./about.tsx"),
      (mod) => mod.About,
    ),
  },
  {
    path: "guide",
    Component: lazyPage(
      () => import("./pages/school/AdmissionGuide.tsx"),
      (mod) => mod.default,
    ),
  },
  {
    path: "introduction",
    Component: lazyPage(
      () => import("./pages/school/CollegeIntroduction.tsx"),
      (mod) => mod.default,
    ),
  },
  {
    path: "about",
  },
];
export default routes;
