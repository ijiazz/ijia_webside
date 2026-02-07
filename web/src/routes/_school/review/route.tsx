import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_school/review")({
  component: RouteComponent,
});

function RouteComponent() {
  return <Outlet />;
}
