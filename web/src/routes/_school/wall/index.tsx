import { createFileRoute, Navigate } from "@tanstack/react-router";
import React from "react";

export const Route = createFileRoute("/_school/wall/")({
  component: () => <Navigate to="./list" from={Route.path} replace />,
});
