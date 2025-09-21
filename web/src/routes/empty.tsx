import { createFileRoute } from "@tanstack/react-router";
import React from "react";
//测试页面
export const Route = createFileRoute("/empty")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>empty</div>;
}
