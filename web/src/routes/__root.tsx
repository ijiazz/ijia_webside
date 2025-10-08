import { createRootRoute, Outlet } from "@tanstack/react-router";

import React, { useEffect } from "react";
import { removeLoading } from "@/app.ts";
import { LayoutDirectionProvider } from "@/provider/LayoutDirectionProvider.tsx";
import { RouterProgress } from "./-layout/Progress.tsx";

export const Route = createRootRoute({
  component: () => {
    useEffect(() => {
      removeLoading();
    }, []);

    return (
      <LayoutDirectionProvider>
        <Outlet />
        <RouterProgress />
      </LayoutDirectionProvider>
    );
  },
});
