import { createRootRoute, Outlet } from "@tanstack/react-router";

import { useEffect } from "react";
import { removeLoading } from "@/app.ts";
import { LayoutDirectionProvider } from "@/provider/LayoutDirectionProvider.tsx";
import { RouterProgress } from "./-layout/Progress.tsx";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/request/client.ts";

export const Route = createRootRoute({
  component: () => {
    useEffect(() => {
      removeLoading();
    }, []);

    return (
      <QueryClientProvider client={queryClient}>
        <LayoutDirectionProvider>
          <Outlet />
          <RouterProgress />
        </LayoutDirectionProvider>
      </QueryClientProvider>
    );
  },
});
