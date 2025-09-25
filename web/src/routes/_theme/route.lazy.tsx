import { createLazyFileRoute } from "@tanstack/react-router";
import React from "react";
import { Outlet } from "@tanstack/react-router";
import "@ant-design/v5-patch-for-react-19";
import { AntdThemeProvider } from "@/provider/AntdProvider.tsx";

export const Route = createLazyFileRoute("/_theme")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <AntdThemeProvider fixedMode="light">
      <Outlet />
    </AntdThemeProvider>
  );
}
