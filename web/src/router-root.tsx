import { Outlet, createHashRouter, RouteObject } from "react-router";
import passportRouter from "./modules/passport/router.tsx";
import profileRouter from "./modules/profile/router.tsx";
import { AntdProvider, HoFetchProvider } from "./global-provider.tsx";
import { notFoundRouter } from "./modules/error_page/NotFound.tsx";
import { PublicLayout } from "./modules/layout/BaseLayout.tsx";
import { UserLayout } from "./modules/layout/UserLayout.tsx";

const coreRouters: RouteObject[] = [
  { index: true, element: <div>home</div> },
  { path: "passport", children: passportRouter },
  {
    Component: PublicLayout,
    children: [{ path: "live/*", element: <div>live</div> }],
  },
  {
    Component: UserLayout,
    children: [
      { path: "profile", children: profileRouter },
      { path: "examination/*", element: <div>examination</div> },
    ],
  },
  notFoundRouter,
];

export default createHashRouter([
  {
    path: "/",
    element: (
      <AntdProvider>
        <HoFetchProvider>
          <Outlet />
        </HoFetchProvider>
      </AntdProvider>
    ),
    children: coreRouters,
  },
]);
