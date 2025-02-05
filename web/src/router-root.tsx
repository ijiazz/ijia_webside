import { createHashRouter, createRoutesFromElements, Route, RouterProvider } from "react-router";

function createRoute() {
  const routers = <Route path="/" element={<div>hhh</div>}></Route>;
  return createRoutesFromElements(routers);
}
const router = createHashRouter(createRoute());
export const routerRoot = <RouterProvider router={router}></RouterProvider>;
