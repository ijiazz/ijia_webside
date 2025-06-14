import React from "react";
import { Outlet } from "react-router";

import { AntdThemeProvider } from "./provider/AntdProvider.tsx";
import { HoFetchProvider } from "./provider/HoFetchProvider.tsx";
import { LayoutDirectionProvider } from "./provider/LayoutDirectionProvider.tsx";

export * from "./provider/LayoutDirectionProvider.tsx";
export * from "./provider/AntdProvider.tsx";
export * from "./provider/HoFetchProvider.tsx";

export function GlobalProvider() {
  return (
    <AntdThemeProvider fixedMode="light">
      <HoFetchProvider>
        <LayoutDirectionProvider>
          <Outlet />
        </LayoutDirectionProvider>
      </HoFetchProvider>
    </AntdThemeProvider>
  );
}
