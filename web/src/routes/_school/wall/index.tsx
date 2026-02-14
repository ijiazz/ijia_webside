import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_school/wall/")({
  component: () => <Navigate to="/wall/list/{-$groupId}" replace />,
});
