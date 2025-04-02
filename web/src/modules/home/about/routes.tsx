import { RouteObject } from "react-router";
import { About } from "./about.tsx";
import { Contribute } from "./contribute.tsx";
const route: RouteObject = {
  path: "about",
  children: [
    {
      index: true,
      Component: About,
    },
    {
      path: "contribute",
      Component: Contribute,
    },
  ],
};

export default route;
