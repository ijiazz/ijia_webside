import { LazyRouteFunction, RouteObject } from "react-router";

export type LazyRoute = Awaited<ReturnType<LazyRouteFunction<RouteObject>>>;
