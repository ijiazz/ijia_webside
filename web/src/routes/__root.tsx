import { createRootRoute } from "@tanstack/react-router";

// import { GlobalProvider } from "../global-provider.tsx";
import React, { useEffect } from "react";
import { removeLoading } from "@/app.ts";
import { lazyComponent } from "@/lib/lazy_component.tsx";
import { PageLoading } from "@/common/page_state/Loading.tsx";
import { NotFoundPage } from "@/common/page_state/NotFound.tsx";

const GlobalProvider = lazyComponent(
  () => import("../global-provider.tsx"),
  (mod) => mod.GlobalProvider,
);
export const Route = createRootRoute({
  component: () => {
    useEffect(() => {
      removeLoading();
    }, []);
    return <GlobalProvider />;
  },
  notFoundComponent: NotFoundPage,
  pendingComponent: PageLoading,
});
