import { createLazyFileRoute } from "@tanstack/react-router";
import React from "react";
import { Outlet } from "@tanstack/react-router";
import { HoFetchProvider, AntdThemeProvider } from "@/provider/mod.tsx";

export const Route = createLazyFileRoute("/_theme")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <AntdThemeProvider fixedMode="light">
      <HoFetchProvider>
        <Outlet />
      </HoFetchProvider>
    </AntdThemeProvider>
  );
}
