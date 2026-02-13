import { createFileRoute } from "@tanstack/react-router";
import React from "react";
export const Route = createFileRoute("/_theme/test-page/")({
  component: RouteComponent,
});

function RouteComponent() {
  if (!import.meta.env.DEV) return null;
  return (
    <div style={{ backgroundColor: "#000", height: "100%", color: "#fff", padding: "20px", boxSizing: "border-box" }}>
      test
    </div>
  );
}
