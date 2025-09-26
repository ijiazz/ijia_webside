import { createRootRoute, Outlet } from "@tanstack/react-router";

import React, { useEffect } from "react";
import { removeLoading } from "@/app.ts";
import { PageLoading } from "@/common/page_state/Loading.tsx";
import { NotFoundPage } from "@/common/page_state/NotFound.tsx";
import { LayoutDirectionProvider } from "@/provider/LayoutDirectionProvider.tsx";

export const Route = createRootRoute({
  component: () => {
    useEffect(() => {
      removeLoading();
    }, []);
    return (
      <LayoutDirectionProvider>
        <Outlet />
      </LayoutDirectionProvider>
    );
  },
  notFoundComponent: NotFoundPage,
  pendingComponent: PageLoading,
});
